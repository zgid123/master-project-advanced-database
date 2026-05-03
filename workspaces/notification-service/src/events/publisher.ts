import { getRedis } from '../cache/redis.js';
import { pool, withTransaction } from '../db/pool.js';
import { logger } from '../observability/logger.js';

type OutboxRow = {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  headers: Record<string, unknown>;
};

let shuttingDown = false;

export async function publishBatch(limit = 200): Promise<number> {
  const redis = await getRedis();

  return withTransaction(async (client) => {
    const result = await client.query<OutboxRow>({
      name: 'notification-outbox-fetch-batch',
      text: `
        SELECT id, event_type, payload, headers
        FROM notification_outbox
        WHERE published_at IS NULL
        ORDER BY id
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `,
      values: [limit],
    });

    if (result.rows.length === 0) return 0;

    try {
      const pipe = redis.pipeline();
      for (const row of result.rows) {
        pipe.xadd(
          'events:notification',
          'MAXLEN',
          '~',
          '500000',
          '*',
          'type',
          row.event_type,
          'id',
          row.id,
          'payload',
          JSON.stringify(row.payload),
          'headers',
          JSON.stringify(row.headers ?? {}),
          'ts',
          Date.now().toString(),
        );
      }

      const pipeResult = await pipe.exec();
      const pipeError = pipeResult?.find(([error]) => error)?.[0];
      if (pipeError) throw pipeError;

      await client.query({
        name: 'notification-outbox-mark-batch-published',
        text: `
          UPDATE notification_outbox
          SET published_at = now(),
              last_error = NULL
          WHERE id = ANY($1::bigint[])
        `,
        values: [result.rows.map((row) => row.id)],
      });

      return result.rows.length;
    } catch (error) {
      await client.query({
        name: 'notification-outbox-mark-batch-error',
        text: `
          UPDATE notification_outbox
          SET last_error = $2
          WHERE id = ANY($1::bigint[])
        `,
        values: [result.rows.map((row) => row.id), error instanceof Error ? error.message : String(error)],
      });
      return 0;
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('starting notification outbox publisher');

  try {
    while (!shuttingDown) {
      const count = await publishBatch().catch((error: unknown) => {
        logger.error({ error }, 'notification outbox publish failed');
        return 0;
      });

      if (count === 0 && !shuttingDown) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
    }
  } finally {
    await pool.end();
  }
}

process.on('SIGTERM', () => {
  shuttingDown = true;
});

process.on('SIGINT', () => {
  shuttingDown = true;
});
