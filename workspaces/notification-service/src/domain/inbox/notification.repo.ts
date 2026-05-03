import type { PgClient } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import type { KeysetCursor } from '../pagination.js';
import type { CreatedNotification, InsertNotificationInput, NotificationRow } from './notification.types.js';

export const NotificationRepo = {
  async listForUser(
    userId: string,
    cursor: KeysetCursor | null,
    limit: number,
    filter: 'all' | 'unread' | { category: string },
  ): Promise<NotificationRow[]> {
    const values: unknown[] = [userId];
    let cursorFilter = '';
    let unreadFilter = '';
    let categoryFilter = '';

    if (filter === 'unread') {
      unreadFilter = 'AND n.read = false';
    } else if (typeof filter === 'object') {
      values.push(filter.category);
      categoryFilter = `AND c.code = $${values.length}`;
    }

    if (cursor) {
      values.push(cursor.createdAt, cursor.id);
      cursorFilter = `AND (n.created_at, n.id) < ($${values.length - 1}::timestamptz, $${values.length}::bigint)`;
    }

    values.push(limit);
    const limitParam = values.length;

    const result = await pool.query<NotificationRow>({
      name: cursor ? 'notifications-list-keyset-cursor' : 'notifications-list-keyset-first',
      text: `
        SELECT n.*, c.code AS category_code
        FROM notifications n
        JOIN notification_categories c ON c.id = n.category_id
        WHERE n.user_id = $1
          AND n.archived = false
          AND n.created_at >= now() - interval '90 days'
          ${unreadFilter}
          ${categoryFilter}
          ${cursorFilter}
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT $${limitParam}
      `,
      values,
    });

    return result.rows;
  },

  async unreadCount(userId: string): Promise<number> {
    const result = await pool.query<{ c: number }>({
      name: 'notifications-unread-count',
      text: `
        SELECT count(*)::int AS c
        FROM notifications
        WHERE user_id = $1
          AND read = false
          AND archived = false
          AND created_at >= now() - interval '90 days'
      `,
      values: [userId],
    });

    return result.rows[0]?.c ?? 0;
  },

  async markRead(userId: string, publicId: string): Promise<boolean> {
    const result = await pool.query({
      name: 'notifications-mark-read',
      text: `
        UPDATE notifications
        SET read = true,
            read_at = now(),
            updated_at = now()
        WHERE public_id = $1
          AND user_id = $2
          AND read = false
          AND archived = false
      `,
      values: [publicId, userId],
    });

    return (result.rowCount ?? 0) > 0;
  },

  async markAllRead(userId: string): Promise<number> {
    const result = await pool.query({
      name: 'notifications-mark-all-read',
      text: `
        UPDATE notifications
        SET read = true,
            read_at = now(),
            updated_at = now()
        WHERE user_id = $1
          AND read = false
          AND archived = false
          AND created_at >= now() - interval '90 days'
      `,
      values: [userId],
    });

    return result.rowCount ?? 0;
  },

  async archive(userId: string, publicId: string): Promise<boolean> {
    const result = await pool.query({
      name: 'notifications-archive',
      text: `
        UPDATE notifications
        SET archived = true,
            updated_at = now()
        WHERE public_id = $1
          AND user_id = $2
          AND archived = false
      `,
      values: [publicId, userId],
    });

    return (result.rowCount ?? 0) > 0;
  },

  async consumeEventOnce(
    eventId: string,
    sourceService: string,
    client: PgClient,
  ): Promise<boolean> {
    const result = await client.query({
      name: 'notification-event-dedup-insert',
      text: `
        INSERT INTO notification_inbox_dedup(event_id, source_service)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      values: [eventId, sourceService],
    });

    return (result.rowCount ?? 0) > 0;
  },

  async claimRecipientDedup(
    userId: string,
    dedupKey: string | null,
    client: PgClient,
  ): Promise<boolean> {
    if (!dedupKey) return true;

    const result = await client.query({
      name: 'notification-recipient-dedup-claim',
      text: `
        INSERT INTO notification_recipient_dedup(user_id, dedup_key)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      values: [userId, dedupKey],
    });

    return (result.rowCount ?? 0) > 0;
  },

  async linkRecipientDedup(
    userId: string,
    dedupKey: string | null,
    notificationId: string,
    notificationCreatedAt: Date,
    client: PgClient,
  ): Promise<void> {
    if (!dedupKey) return;

    await client.query({
      name: 'notification-recipient-dedup-link',
      text: `
        UPDATE notification_recipient_dedup
        SET notification_id = $3,
            notification_created_at = $4
        WHERE user_id = $1
          AND dedup_key = $2
      `,
      values: [userId, dedupKey, notificationId, notificationCreatedAt],
    });
  },

  async insert(
    input: InsertNotificationInput,
    categoryCode: string,
    client: PgClient,
  ): Promise<CreatedNotification> {
    const result = await client.query<CreatedNotification>({
      name: 'notification-insert',
      text: `
        INSERT INTO notifications (
          user_id, category_id, template_id, title, body,
          source_service, source_type, source_id, actor_user_id, dedup_key, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::bigint, $9::bigint, $10, $11::jsonb)
        RETURNING id, public_id, user_id, category_id, $12::text AS category_code,
                  title, body, metadata, created_at
      `,
      values: [
        input.user_id,
        input.category_id,
        input.template_id,
        input.title,
        input.body,
        input.source_service,
        input.source_type,
        input.source_id,
        input.actor_user_id,
        input.dedup_key,
        JSON.stringify(input.metadata),
        categoryCode,
      ],
    });

    return result.rows[0] as CreatedNotification;
  },

  async appendOutbox(
    aggregate: string,
    eventType: string,
    payload: Record<string, unknown>,
    client: PgClient,
  ): Promise<void> {
    await client.query({
      name: 'notification-outbox-append',
      text: `
        INSERT INTO notification_outbox(aggregate, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      values: [aggregate, eventType, JSON.stringify(payload)],
    });
  },
};
