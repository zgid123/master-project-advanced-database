import pg from 'pg';
import { config } from '../config.js';
import { logger } from '../observability/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: config.pgPoolMax,
  min: config.pgPoolMin,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  maxUses: config.pgPoolMaxUses,
  application_name: 'notification-service',
});

pool.on('error', (error) => {
  logger.error({ error }, 'postgres pool error');
});

export type PgClient = pg.PoolClient;

export async function withTransaction<T>(
  fn: (client: PgClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL statement_timeout = '30s'");
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackError: unknown) => {
      logger.error({ rollbackError }, 'postgres rollback failed');
    });
    throw error;
  } finally {
    client.release();
  }
}
