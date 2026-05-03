import { getRedis } from '../cache/redis.js';
import { pool, withTransaction } from '../db/pool.js';
import { logger } from '../observability/logger.js';

type OutboxRow = {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  headers: Record<string, unknown>;
};

type PublishOneResult = 'published' | 'empty' | 'failed';
let shuttingDown = false;

async function publishOne(redis: Awaited<ReturnType<typeof getRedis>>): Promise<PublishOneResult> {
  return withTransaction(async (client) => {
    const result = await client.query<OutboxRow>({
      name: 'notification-outbox-fetch-one',
      text: `
        SELECT id, event_type, payload, headers
        FROM notification_outbox
        WHERE published_at IS NULL
        ORDER BY id
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `,
    });

    const row = result.rows[0];
    if (!row) return 'empty';

    try {
      await redis.xadd(
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
      await client.query('UPDATE notification_outbox SET published_at = now(), last_error = NULL WHERE id = $1', [
        row.id,
      ]);
      return 'published';
    } catch (error) {
      await client.query('UPDATE notification_outbox SET last_error = $2 WHERE id = $1', [
        row.id,
        error instanceof Error ? error.message : String(error),
      ]);
      return 'failed';
    }
  });
}

export async function publishBatch(limit = 200): Promise<number> {
  const redis = await getRedis();
  let published = 0;

  for (let index = 0; index < limit; index += 1) {
    const result = await publishOne(redis);
    if (result === 'published') {
      published += 1;
      continue;
    }
    break;
  }

  return published;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('starting notification outbox publisher');

  while (!shuttingDown) {
    const count = await publishBatch().catch((error: unknown) => {
      logger.error({ error }, 'notification outbox publish failed');
      return 0;
    });

    if (count === 0 && !shuttingDown) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }

  await pool.end();
}

process.on('SIGTERM', () => {
  shuttingDown = true;
});

process.on('SIGINT', () => {
  shuttingDown = true;
});
