import { logger } from '../observability/logger.js';
import { getRedis } from './redis.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
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
    // Cache is optional; PostgreSQL remains the source of truth.
  }
}

export async function delKeys(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  try {
    const client = await getRedis();
    await client.del(...keys);
  } catch (error) {
    warnCacheFailure('del', error);
    // Cache invalidation is best-effort. Short TTLs bound staleness.
  }
}

export async function singleFlight<T>(
  lockKey: string,
  cacheKey: string,
  load: () => Promise<T>,
): Promise<T> {
  const client = await getRedis();
  const gotLock = await client.set(lockKey, '1', 'PX', 5_000, 'NX');

  if (!gotLock) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await sleep(30);
      const cached = await client.get(cacheKey);
      if (cached) return JSON.parse(cached) as T;
    }
    return load();
  }

  try {
    const cached = await client.get(cacheKey);
    if (cached) return JSON.parse(cached) as T;
    return await load();
  } finally {
    await client.del(lockKey);
  }
}
