import { delKeys, getJson, setJson } from '../../cache/cache.js';
import { getRedis } from '../../cache/redis.js';
import { withTransaction } from '../../db/pool.js';
import { logger } from '../../observability/logger.js';
import { notificationCreated } from '../../observability/metrics.js';
import { emitNotificationNew } from '../../realtime/emitter.js';
import { enqueueDelivery } from '../../workers/enqueue.js';
import { HttpError } from '../errors.js';
import type { KeysetCursor } from '../pagination.js';
import { pageResponse } from '../pagination.js';
import { PreferenceRepo } from '../preferences/preference.repo.js';
import { renderTemplate } from '../templates/renderer.js';
import { TemplateRepo } from '../templates/template.repo.js';
import type { ChannelCode, ChannelRow } from '../templates/template.types.js';
import { NotificationRepo } from './notification.repo.js';
import type { CreateNotificationEventInput, CreatedNotification, NotificationRow } from './notification.types.js';

type ListFilter = 'all' | 'unread' | { category: string };
type RepoListFilter = 'all' | 'unread' | { categoryId: number };

type IngestResult = {
  duplicate_event: boolean;
  inserted: CreatedNotification[];
  skipped_recipients: number;
};

function unreadCacheKey(userId: string): string {
  return `notif:unread:${userId}`;
}

function feedCacheKey(userId: string): string {
  return `notif:feed:${userId}`;
}

function normalizeFilter(filter: string): ListFilter {
  if (filter === 'all' || filter === 'unread') return filter;
  return { category: filter.replace(/^category:/, '') };
}

function nonInAppChannel(channel: ChannelRow): channel is ChannelRow & { code: Exclude<ChannelCode, 'in_app'> } {
  return channel.code !== 'in_app';
}

export function localHourInTimezone(now: Date, timezone: string): number {
  try {
    const hourPart = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now).find((part) => part.type === 'hour');
    const hour = Number(hourPart?.value);
    return Number.isInteger(hour) ? hour : now.getUTCHours();
  } catch {
    return now.getUTCHours();
  }
}

export function inQuietHours(
  now: Date,
  start: number | null,
  end: number | null,
  timezone: string,
): boolean {
  if (start === null || end === null || start === end) return false;

  const hour = localHourInTimezone(now, timezone);
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

async function cacheNewNotifications(rows: CreatedNotification[]): Promise<void> {
  if (rows.length === 0) return;

  try {
    const redis = await getRedis();
    const pipe = redis.pipeline();
    for (const row of rows) {
      pipe.incr(unreadCacheKey(row.user_id));
      pipe.expire(unreadCacheKey(row.user_id), 604_800);
      pipe.zadd(
        feedCacheKey(row.user_id),
        row.created_at.getTime(),
        JSON.stringify({
          id: row.public_id,
          title: row.title,
          created_at: row.created_at.toISOString(),
        }),
      );
      pipe.zremrangebyrank(feedCacheKey(row.user_id), 0, -101);
      pipe.expire(feedCacheKey(row.user_id), 604_800);
    }
    await pipe.exec();
  } catch (error) {
    logger.warn({ error, count: rows.length }, 'notification cache update failed');
  }
}

async function sideEffects(
  input: CreateNotificationEventInput,
  rows: CreatedNotification[],
  channelsByNotification: Map<string, Array<ChannelRow & { code: Exclude<ChannelCode, 'in_app'> }>>,
): Promise<void> {
  await cacheNewNotifications(rows);

  for (const row of rows) {
    notificationCreated.inc({ category: row.category_code });
    await emitNotificationNew(row.user_id, {
      id: row.public_id,
      title: row.title,
      body: row.body,
      category_code: row.category_code,
      created_at: row.created_at.toISOString(),
      metadata: row.metadata,
    });

    for (const channel of channelsByNotification.get(row.id) ?? []) {
      await enqueueDelivery({
        notification_id: row.id,
        notification_created_at: row.created_at.toISOString(),
        public_id: row.public_id,
        user_id: row.user_id,
        channel_code: channel.code,
        category_code: input.category_code,
        title: row.title,
        body: row.body,
        metadata: row.metadata,
      }).catch((error: unknown) => {
        logger.error({ error, notificationId: row.id, channel: channel.code }, 'delivery enqueue failed');
      });
    }
  }
}

export const NotificationService = {
  async list(
    userId: string,
    cursor: KeysetCursor | null,
    limit: number,
    filter: string,
  ): Promise<{ items: NotificationRow[]; next_cursor: string | null }> {
    const normalizedFilter = normalizeFilter(filter);
    let repoFilter: RepoListFilter = normalizedFilter === 'all' || normalizedFilter === 'unread'
      ? normalizedFilter
      : 'all';

    if (typeof normalizedFilter === 'object') {
      const category = await TemplateRepo.categoryByCode(normalizedFilter.category);
      if (!category) return { items: [], next_cursor: null };
      repoFilter = { categoryId: category.id };
    }

    const rows = await NotificationRepo.listForUser(userId, cursor, limit, repoFilter);
    return pageResponse(rows, limit);
  },

  async unreadCount(userId: string): Promise<{ count: number }> {
    const cached = await getJson<number>(unreadCacheKey(userId));
    if (cached !== null) return { count: cached };

    const count = Math.min(await NotificationRepo.unreadCount(userId), 1000);
    await setJson(unreadCacheKey(userId), count, 604_800);
    return { count };
  },

  async markRead(userId: string, publicId: string): Promise<{ ok: boolean }> {
    const ok = await NotificationRepo.markRead(userId, publicId);
    if (!ok) throw new HttpError(404, 'NOT_FOUND', 'Notification was not found');
    await delKeys(unreadCacheKey(userId));
    return { ok };
  },

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const updated = await NotificationRepo.markAllRead(userId);
    await delKeys(unreadCacheKey(userId), feedCacheKey(userId));
    return { updated };
  },

  async archive(userId: string, publicId: string): Promise<{ ok: boolean }> {
    const ok = await NotificationRepo.archive(userId, publicId);
    if (!ok) throw new HttpError(404, 'NOT_FOUND', 'Notification was not found');
    await delKeys(unreadCacheKey(userId), feedCacheKey(userId));
    return { ok };
  },

  async ingest(input: CreateNotificationEventInput): Promise<IngestResult> {
    const channelsByNotification = new Map<string, Array<ChannelRow & { code: Exclude<ChannelCode, 'in_app'> }>>();

    const result = await withTransaction(async (client) => {
      const firstConsumer = await NotificationRepo.consumeEventOnce(input.event_id, input.source_service, client);
      if (!firstConsumer) {
        return {
          duplicate_event: true,
          inserted: [],
          skipped_recipients: input.recipients.length,
        };
      }

      const category = await TemplateRepo.categoryByCode(input.category_code, client);
      if (!category) {
        throw new HttpError(400, 'UNKNOWN_CATEGORY', 'Notification category is not known');
      }

      const inAppTemplate = await TemplateRepo.activeTemplate(category.id, 'in_app', input.locale, client);
      const defaultChannels = await TemplateRepo.channelsByIds(category.default_channels, client);
      const candidates = input.recipients.map((recipient) => {
        const dedupKey = `${input.dedup_key_prefix ?? input.event_id}:${recipient.user_id}`;
        const templateData = {
          ...input.data,
          user_id: recipient.user_id,
        };
        const title = input.title ?? renderTemplate(inAppTemplate?.subject ?? '{{category_code}}', {
          ...templateData,
          category_code: input.category_code,
        });
        const body = input.body ?? renderTemplate(inAppTemplate?.body ?? '{{category_code}}', {
          ...templateData,
          category_code: input.category_code,
        });

        return {
          dedupKey,
          insert: {
            user_id: recipient.user_id,
            category_id: category.id,
            template_id: inAppTemplate?.id ?? null,
            title,
            body,
            source_service: input.source_service,
            source_type: input.source_type ?? null,
            source_id: input.source_id ?? null,
            actor_user_id: input.actor_user_id ?? null,
            dedup_key: dedupKey,
            metadata: input.data,
          },
        };
      });

      const claimed = await NotificationRepo.claimRecipientDedupMany(
        candidates.map((candidate) => ({
          user_id: candidate.insert.user_id,
          dedup_key: candidate.dedupKey,
        })),
        client,
      );
      const claimedKeys = new Set(claimed.map((row) => `${row.user_id}:${row.dedup_key}`));
      const insertInputs = candidates
        .filter((candidate) => claimedKeys.has(`${candidate.insert.user_id}:${candidate.dedupKey}`))
        .map((candidate) => candidate.insert);
      const inserted = await NotificationRepo.insertMany(insertInputs, category.code, client);
      const skippedRecipients = input.recipients.length - inserted.length;

      await NotificationRepo.linkRecipientDedupMany(
        inserted.map((row) => ({
          user_id: row.user_id,
          dedup_key: row.dedup_key,
          notification_id: row.id,
          notification_created_at: row.created_at,
        })),
        client,
      );
      await NotificationRepo.appendOutboxMany(
        inserted.map((row) => ({
          aggregate: 'notification',
          event_type: 'notification.created',
          payload: {
            id: row.id,
            public_id: row.public_id,
            user_id: row.user_id,
            category_code: row.category_code,
            source_service: input.source_service,
            event_id: input.event_id,
          },
        })),
        client,
      );

      const prefs = await PreferenceRepo.channelPrefsForUsersCategory(
        [...new Set(inserted.map((row) => row.user_id))],
        category.id,
        client,
      );
      const prefsByUser = new Map<string, Map<number, (typeof prefs)[number]>>();
      for (const pref of prefs) {
        const userPrefs = prefsByUser.get(pref.user_id) ?? new Map<number, (typeof prefs)[number]>();
        userPrefs.set(pref.channel_id, pref);
        prefsByUser.set(pref.user_id, userPrefs);
      }
      const now = new Date();

      for (const row of inserted) {
        const prefsByChannelId = prefsByUser.get(row.user_id) ?? new Map<number, (typeof prefs)[number]>();
        const deliverableChannels = defaultChannels
          .filter(nonInAppChannel)
          .filter((channel) => {
            if (category.is_transactional) return true;
            const pref = prefsByChannelId.get(channel.id);
            if (pref?.enabled === false) return false;
            if (!pref) return true;
            return !inQuietHours(now, pref.quiet_hours_start, pref.quiet_hours_end, pref.timezone);
          });

        channelsByNotification.set(row.id, deliverableChannels);
      }

      return {
        duplicate_event: false,
        inserted,
        skipped_recipients: skippedRecipients,
      };
    });

    await sideEffects(input, result.inserted, channelsByNotification);
    return result;
  },
};
