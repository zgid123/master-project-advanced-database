import type { PgClient } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import type { KeysetCursor } from '../pagination.js';
import { HttpError } from '../errors.js';
import type { CreatedNotification, InsertNotificationInput, NotificationRow } from './notification.types.js';

type RecipientDedupClaim = {
  user_id: string;
  dedup_key: string;
};

type OutboxInsertInput = {
  aggregate: string;
  event_type: string;
  payload: Record<string, unknown>;
};

export const NotificationRepo = {
  async listForUser(
    userId: string,
    cursor: KeysetCursor | null,
    limit: number,
    filter: 'all' | 'unread' | { categoryId: number },
  ): Promise<NotificationRow[]> {
    const values: unknown[] = [userId];
    let cursorFilter = '';
    let unreadFilter = '';
    let categoryFilter = '';

    if (filter === 'unread') {
      unreadFilter = 'AND n.read = false';
    } else if (typeof filter === 'object') {
      values.push(filter.categoryId);
      categoryFilter = `AND n.category_id = $${values.length}`;
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
        FROM (
          SELECT 1
          FROM notifications
          WHERE user_id = $1
            AND read = false
            AND archived = false
            AND created_at >= now() - interval '90 days'
          LIMIT 1001
        ) bounded
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

  async claimRecipientDedupMany(
    recipients: RecipientDedupClaim[],
    client: PgClient,
  ): Promise<RecipientDedupClaim[]> {
    if (recipients.length === 0) return [];

    const result = await client.query<RecipientDedupClaim>({
      name: 'notification-recipient-dedup-claim-many',
      text: `
        WITH input AS (
          SELECT *
          FROM jsonb_to_recordset($1::jsonb) AS x(user_id bigint, dedup_key text)
        )
        INSERT INTO notification_recipient_dedup(user_id, dedup_key)
        SELECT user_id, dedup_key
        FROM input
        ON CONFLICT DO NOTHING
        RETURNING user_id, dedup_key
      `,
      values: [JSON.stringify(recipients)],
    });

    return result.rows;
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

  async linkRecipientDedupMany(
    rows: Array<{
      user_id: string;
      dedup_key: string | null;
      notification_id: string;
      notification_created_at: Date;
    }>,
    client: PgClient,
  ): Promise<void> {
    const linkableRows = rows.filter((row): row is {
      user_id: string;
      dedup_key: string;
      notification_id: string;
      notification_created_at: Date;
    } => row.dedup_key !== null);

    if (linkableRows.length === 0) return;

    await client.query({
      name: 'notification-recipient-dedup-link-many',
      text: `
        WITH input AS (
          SELECT *
          FROM jsonb_to_recordset($1::jsonb) AS x(
            user_id bigint,
            dedup_key text,
            notification_id bigint,
            notification_created_at timestamptz
          )
        )
        UPDATE notification_recipient_dedup d
        SET notification_id = input.notification_id,
            notification_created_at = input.notification_created_at
        FROM input
        WHERE d.user_id = input.user_id
          AND d.dedup_key = input.dedup_key
      `,
      values: [JSON.stringify(linkableRows)],
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
                  title, body, metadata, dedup_key, created_at
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

    const row = result.rows[0];
    if (!row) throw new HttpError(500, 'NOTIFICATION_INSERT_FAILED', 'Notification insert did not return a row');
    return row;
  },

  async insertMany(
    inputs: InsertNotificationInput[],
    categoryCode: string,
    client: PgClient,
  ): Promise<CreatedNotification[]> {
    if (inputs.length === 0) return [];

    const result = await client.query<CreatedNotification>({
      name: 'notification-insert-many',
      text: `
        WITH input AS (
          SELECT *
          FROM jsonb_to_recordset($1::jsonb) AS x(
            user_id bigint,
            category_id smallint,
            template_id bigint,
            title text,
            body text,
            source_service text,
            source_type text,
            source_id bigint,
            actor_user_id bigint,
            dedup_key text,
            metadata jsonb
          )
        )
        INSERT INTO notifications (
          user_id, category_id, template_id, title, body,
          source_service, source_type, source_id, actor_user_id, dedup_key, metadata
        )
        SELECT user_id, category_id, template_id, title, body,
               source_service, source_type, source_id, actor_user_id, dedup_key, metadata
        FROM input
        RETURNING id, public_id, user_id, category_id, $2::text AS category_code,
                  title, body, metadata, dedup_key, created_at
      `,
      values: [JSON.stringify(inputs), categoryCode],
    });

    return result.rows;
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

  async appendOutboxMany(
    rows: OutboxInsertInput[],
    client: PgClient,
  ): Promise<void> {
    if (rows.length === 0) return;

    await client.query({
      name: 'notification-outbox-append-many',
      text: `
        INSERT INTO notification_outbox(aggregate, event_type, payload)
        SELECT aggregate, event_type, payload
        FROM jsonb_to_recordset($1::jsonb) AS x(
          aggregate text,
          event_type text,
          payload jsonb
        )
      `,
      values: [JSON.stringify(rows)],
    });
  },
};
