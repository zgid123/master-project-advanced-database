import { getRedis } from '../cache/redis.js';
import { pool, withTransaction } from '../db/pool.js';
import { logger } from '../observability/logger.js';

type OutboxRow = {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
};

async function publishBatch(limit = 100): Promise<number> {
  const redis = await getRedis();

  return withTransaction(async (client) => {
    const result = await client.query<OutboxRow>({
      name: 'outbox-fetch-unsent',
      text: `
        SELECT id, event_type, payload
        FROM event_outbox
        WHERE sent_at IS NULL
        ORDER BY id
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `,
      values: [limit],
    });

    for (const row of result.rows) {
      try {
        await redis.xadd(
          'jobs.events',
          '*',
          'type',
          row.event_type,
          'id',
          row.id,
          'payload',
          JSON.stringify(row.payload),
          'ts',
          Date.now().toString(),
        );
        await client.query('UPDATE event_outbox SET sent_at = now(), last_error = NULL WHERE id = $1', [
          row.id,
        ]);
      } catch (error) {
        await client.query('UPDATE event_outbox SET last_error = $2 WHERE id = $1', [
          row.id,
          error instanceof Error ? error.message : String(error),
        ]);
        throw error;
      }
    }

    return result.rowCount ?? 0;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('starting outbox publisher');

  for (;;) {
    const count = await publishBatch().catch((error: unknown) => {
      logger.error({ error }, 'outbox publish failed');
      return 0;
    });

    if (count === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

export { publishBatch };

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
