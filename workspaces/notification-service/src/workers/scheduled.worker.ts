import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { pool, withTransaction } from '../db/pool.js';
import { NotificationService } from '../domain/inbox/notification.service.js';
import { createNotificationEventSchema } from '../domain/inbox/notification.types.js';
import { logger } from '../observability/logger.js';

type ScheduledNotificationRow = {
  id: string;
  payload: unknown;
  attempts: number;
};

const workerId = `${hostname()}-${process.pid}-${randomUUID().slice(0, 8)}`;
const pollMs = Number(process.env.SCHEDULED_NOTIFICATION_POLL_MS ?? 5_000);
const batchSize = Number(process.env.SCHEDULED_NOTIFICATION_BATCH_SIZE ?? 100);
const maxAttempts = Number(process.env.SCHEDULED_NOTIFICATION_MAX_ATTEMPTS ?? 5);
let shuttingDown = false;

export async function claimDueScheduledNotifications(limit = batchSize): Promise<ScheduledNotificationRow[]> {
  return withTransaction(async (client) => {
    const result = await client.query<ScheduledNotificationRow>({
      name: 'scheduled-notifications-claim-due',
      text: `
        WITH due AS (
          SELECT id
          FROM scheduled_notifications
          WHERE status = 0
            AND fire_at <= now()
            AND (locked_until IS NULL OR locked_until < now())
          ORDER BY fire_at, id
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE scheduled_notifications s
        SET locked_by = $2,
            locked_until = now() + interval '5 minutes',
            attempts = s.attempts + 1
        FROM due
        WHERE s.id = due.id
        RETURNING s.id, s.payload, s.attempts
      `,
      values: [limit, workerId],
    });

    return result.rows;
  });
}

async function finishScheduledNotification(id: string): Promise<void> {
  await pool.query({
    name: 'scheduled-notifications-finish',
    text: `
      UPDATE scheduled_notifications
      SET status = 1,
          locked_by = NULL,
          locked_until = NULL
      WHERE id = $1
    `,
    values: [id],
  });
}

async function failScheduledNotification(id: string, attempts: number): Promise<void> {
  await pool.query({
    name: 'scheduled-notifications-fail',
    text: `
      UPDATE scheduled_notifications
      SET status = CASE WHEN attempts >= $2 THEN 2 ELSE 0 END,
          locked_by = NULL,
          locked_until = NULL
      WHERE id = $1
    `,
    values: [id, maxAttempts],
  });

  if (attempts >= maxAttempts) {
    logger.error({ scheduledNotificationId: id, attempts }, 'scheduled notification exhausted retries');
  }
}

export async function processDueScheduledNotifications(limit = batchSize): Promise<number> {
  const rows = await claimDueScheduledNotifications(limit);

  for (const row of rows) {
    try {
      const payload = createNotificationEventSchema.parse(row.payload);
      const result = await NotificationService.ingest(payload);
      await finishScheduledNotification(row.id);
      logger.info({
        scheduledNotificationId: row.id,
        eventId: payload.event_id,
        inserted: result.inserted.length,
        duplicateEvent: result.duplicate_event,
      }, 'scheduled notification processed');
    } catch (error) {
      logger.error({ error, scheduledNotificationId: row.id }, 'scheduled notification processing failed');
      await failScheduledNotification(row.id, row.attempts);
    }
  }

  return rows.length;
}

async function runLoop(): Promise<void> {
  logger.info({ workerId }, 'scheduled notification worker started');

  while (!shuttingDown) {
    const processed = await processDueScheduledNotifications().catch((error: unknown) => {
      logger.error({ error }, 'scheduled notification poll failed');
      return 0;
    });

    if (processed === 0 && !shuttingDown) {
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runLoop();
}

process.on('SIGTERM', () => {
  shuttingDown = true;
});

process.on('SIGINT', () => {
  shuttingDown = true;
});
