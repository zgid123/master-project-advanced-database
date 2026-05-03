import { logger } from '../observability/logger.js';
import { getRedis } from './redis.js';

const warnedOperations = new Set<string>();

function warnCacheFailure(operation: string, error: unknown): void {
  if (warnedOperations.has(operation)) return;
  warnedOperations.add(operation);
  logger.warn({ error, operation }, 'redis cache operation failed; continuing without cache');
}

export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedis();
    const cached = await client.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch (error) {
    warnCacheFailure('get', error);
    return null;
  }
}

export async function setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const client = await getRedis();
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    warnCacheFailure('set', error);
  }
}

export async function delKeys(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  try {
    const client = await getRedis();
    await client.del(...keys);
  } catch (error) {
    warnCacheFailure('del', error);
  }
}
