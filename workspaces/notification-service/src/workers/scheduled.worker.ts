import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { pool, withTransaction } from '../db/pool.js';
import { NotificationService } from '../domain/inbox/notification.service.js';
import {
  createNotificationEventSchema,
  type CreateNotificationEventInput,
} from '../domain/inbox/notification.types.js';
import { logger } from '../observability/logger.js';
import { scheduledNotificationFailures } from '../observability/metrics.js';
import {
  minimumScheduledLeaseSeconds,
  scheduledInteger,
  scheduledNotificationStatus,
  scheduledRetryDelaySeconds,
} from './scheduled-status.js';

type ScheduledNotificationRow = {
  id: string;
  payload: unknown;
  payload_version: number;
  attempts: number;
};

const workerId = `${hostname()}-${process.pid}-${randomUUID().slice(0, 8)}`;
const pollMs = scheduledInteger(process.env.SCHEDULED_NOTIFICATION_POLL_MS, 5_000, 1_000);
const batchSize = scheduledInteger(process.env.SCHEDULED_NOTIFICATION_BATCH_SIZE, 100, 1);
const maxAttempts = scheduledInteger(process.env.SCHEDULED_NOTIFICATION_MAX_ATTEMPTS, 5, 1);
const leaseSeconds = scheduledInteger(
  process.env.SCHEDULED_NOTIFICATION_LEASE_SECONDS,
  900,
  minimumScheduledLeaseSeconds,
);
const heartbeatFailureLimit = scheduledInteger(
  process.env.SCHEDULED_NOTIFICATION_HEARTBEAT_FAILURE_LIMIT,
  3,
  1,
);
let shuttingDown = false;

type LeaseHeartbeat = {
  get consecutiveFailures(): number;
  assertActive: () => void;
  stop: () => void;
};

type ScheduledPayloadParser = (payload: unknown) => CreateNotificationEventInput;

const scheduledPayloadParsers: Record<number, ScheduledPayloadParser | undefined> = {
  1: (payload) => createNotificationEventSchema.parse(payload),
};

function scheduledErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 2_000) : String(error).slice(0, 2_000);
}

function leaseLostError(id: string): Error {
  return new Error(`Scheduled notification lease was lost for row ${id}`);
}

export async function claimDueScheduledNotifications(limit = batchSize): Promise<ScheduledNotificationRow[]> {
  return withTransaction(async (client) => {
    const result = await client.query<ScheduledNotificationRow>({
      name: 'scheduled-notifications-claim-due',
      text: `
        WITH due AS (
          SELECT id
          FROM scheduled_notifications
          WHERE (
              status = $3
              AND fire_at <= now()
              AND (locked_until IS NULL OR locked_until < now())
            )
            OR (
              status = $4
              AND locked_until < now()
            )
          ORDER BY fire_at, id
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE scheduled_notifications s
        SET status = $4,
            locked_by = $2,
            locked_until = now() + make_interval(secs => $5::int),
            attempts = s.attempts + 1
        FROM due
        WHERE s.id = due.id
          AND s.status IN ($3, $4)
          AND (s.locked_until IS NULL OR s.locked_until < now())
        RETURNING s.id, s.payload, s.payload_version, s.attempts
      `,
      values: [
        limit,
        workerId,
        scheduledNotificationStatus.pending,
        scheduledNotificationStatus.processing,
        leaseSeconds,
      ],
    });

    return result.rows;
  });
}

async function finishScheduledNotification(id: string): Promise<void> {
  const result = await pool.query({
    name: 'scheduled-notifications-finish',
    text: `
      UPDATE scheduled_notifications
      SET status = $2,
          processed_at = now(),
          failed_at = NULL,
          last_error = NULL,
          locked_by = NULL,
          locked_until = NULL
      WHERE id = $1
        AND locked_by = $3
        AND status = $4
    `,
    values: [id, scheduledNotificationStatus.fired, workerId, scheduledNotificationStatus.processing],
  });

  if (result.rowCount === 0) {
    throw leaseLostError(id);
  }
}

async function failScheduledNotification(id: string, attempts: number, error: unknown): Promise<void> {
  const exhausted = attempts >= maxAttempts;
  const retryDelaySeconds = scheduledRetryDelaySeconds(attempts);

  const result = await pool.query({
    name: 'scheduled-notifications-fail',
    text: `
      UPDATE scheduled_notifications
      SET status = CASE WHEN attempts >= $2 THEN $3::smallint ELSE $4::smallint END,
          fire_at = CASE WHEN attempts >= $2 THEN fire_at ELSE now() + make_interval(secs => $5::int) END,
          failed_at = CASE WHEN attempts >= $2 THEN now() ELSE NULL END,
          last_error = $6,
          locked_by = NULL,
          locked_until = NULL
      WHERE id = $1
        AND locked_by = $7
        AND status = $8
    `,
    values: [
      id,
      maxAttempts,
      scheduledNotificationStatus.failed,
      scheduledNotificationStatus.pending,
      retryDelaySeconds,
      scheduledErrorMessage(error),
      workerId,
      scheduledNotificationStatus.processing,
    ],
  });

  if (result.rowCount === 0) {
    logger.error({ scheduledNotificationId: id }, 'scheduled notification failure update skipped after lease loss');
    return;
  }

  if (exhausted) {
    scheduledNotificationFailures.inc();
    logger.error({ scheduledNotificationId: id, attempts }, 'scheduled notification exhausted retries');
  }
}

function parseScheduledPayload(row: ScheduledNotificationRow): CreateNotificationEventInput {
  const parser = scheduledPayloadParsers[row.payload_version];
  if (!parser) {
    throw new Error(`Unsupported scheduled notification payload version: ${row.payload_version}`);
  }

  return parser(row.payload);
}

function startLeaseHeartbeat(id: string): LeaseHeartbeat {
  const intervalMs = Math.max(5_000, Math.floor((leaseSeconds * 1_000) / 3));
  let inFlight = false;
  let consecutiveFailures = 0;
  let lost = false;

  async function extendLease(): Promise<void> {
    if (inFlight || lost) return;
    inFlight = true;
    try {
      const result = await pool.query({
        name: 'scheduled-notifications-extend-lease',
        text: `
          UPDATE scheduled_notifications
          SET locked_until = now() + make_interval(secs => $3::int)
          WHERE id = $1
            AND locked_by = $2
            AND status = $4
        `,
        values: [id, workerId, leaseSeconds, scheduledNotificationStatus.processing],
      });

      if (result.rowCount === 0) {
        lost = true;
        logger.error({ scheduledNotificationId: id }, 'scheduled notification lease was lost');
        return;
      }

      consecutiveFailures = 0;
    } catch (error) {
      consecutiveFailures += 1;
      logger.error({ error, scheduledNotificationId: id }, 'scheduled notification lease heartbeat failed');
      if (consecutiveFailures >= heartbeatFailureLimit) {
        lost = true;
      }
    } finally {
      inFlight = false;
    }
  }

  const timer = setInterval(() => {
    void extendLease();
  }, intervalMs);
  timer.unref();

  return {
    get consecutiveFailures() {
      return consecutiveFailures;
    },
    assertActive() {
      if (lost) throw leaseLostError(id);
    },
    stop() {
      clearInterval(timer);
    },
  };
}

export async function processDueScheduledNotifications(limit = batchSize): Promise<number> {
  const rows = await claimDueScheduledNotifications(limit);

  for (const row of rows) {
    const heartbeat = startLeaseHeartbeat(row.id);
    try {
      const payload = parseScheduledPayload(row);
      const result = await NotificationService.ingest(payload);
      heartbeat.assertActive();
      await finishScheduledNotification(row.id);
      logger.info({
        scheduledNotificationId: row.id,
        eventId: payload.event_id,
        inserted: result.inserted.length,
        duplicateEvent: result.duplicate_event,
      }, 'scheduled notification processed');
    } catch (error) {
      logger.error({ error, scheduledNotificationId: row.id }, 'scheduled notification processing failed');
      await failScheduledNotification(row.id, row.attempts, error);
    } finally {
      heartbeat.stop();
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
