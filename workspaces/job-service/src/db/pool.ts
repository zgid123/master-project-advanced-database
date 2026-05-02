import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';
import { logger } from '../observability/logger.js';
import * as schema from './schema.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: config.pgPoolMax,
  min: config.pgPoolMin,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  maxUses: config.pgPoolMaxUses,
  application_name: 'job-service',
});

pool.on('error', (error) => {
  logger.error({ error }, 'postgres pool error');
});

export const db = drizzle(pool, { schema });

export type PgClient = pg.PoolClient;

export async function withTransaction<T>(
  fn: (client: PgClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
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
