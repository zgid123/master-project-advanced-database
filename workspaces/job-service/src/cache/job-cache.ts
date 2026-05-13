import { logger } from '../observability/logger.js';
import { getRedis } from './redis.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const warnedOperations = new Set<string>();
const earlyRefreshWindowRatio = 0.1;

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

export async function getJsonWithTtl<T>(key: string): Promise<{ value: T | null; ttlMs: number | null }> {
  try {
    const client = await getRedis();
    const pipeline = client.pipeline();
    pipeline.get(key);
    pipeline.pttl(key);
    const results = await pipeline.exec();
    const cached = results?.[0]?.[1];
    const ttl = results?.[1]?.[1];

    return {
      value: typeof cached === 'string' ? (JSON.parse(cached) as T) : null,
      ttlMs: typeof ttl === 'number' && ttl >= 0 ? ttl : null,
    };
  } catch (error) {
    warnCacheFailure('getWithTtl', error);
    return { value: null, ttlMs: null };
  }
}

export async function setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const client = await getRedis();
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    warnCacheFailure('set', error);
    // Cache is optional; MongoDB remains the source of truth.
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
  options: { forceRefresh?: boolean } = {},
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
    if (!options.forceRefresh) {
      const cached = await client.get(cacheKey);
      if (cached) return JSON.parse(cached) as T;
    }
    return await load();
  } finally {
    await client.del(lockKey);
  }
}

export function shouldRefreshEarly(ttlMs: number | null, ttlSeconds: number): boolean {
  if (ttlMs === null) return false;

  const earlyWindowMs = ttlSeconds * 1000 * earlyRefreshWindowRatio;
  const thresholdMs = -Math.log(Math.random()) * earlyWindowMs;
  return ttlMs <= thresholdMs;
}
