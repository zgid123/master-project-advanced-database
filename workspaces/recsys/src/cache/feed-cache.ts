import { randomUUID } from 'node:crypto';

import { config } from '../config.js';
import type { FeedResponse } from '../recommendation/types.js';
import { getRedis } from './redis.js';

const feedKey = (userId: string, limit: number) =>
  `feed:user:${userId}:limit:${limit}`;
const feedLockKey = (userId: string) => `lock:feed:${userId}`;
const trendingKey = (substackId: string | null = null) =>
  substackId ? `trending:substack:${substackId}` : 'trending:global';
const userSubsKey = (userId: string) => `user:subs:${userId}`;

export async function getCachedFeed(
  userId: string,
  limit: number,
): Promise<FeedResponse | null> {
  const redis = await getRedis();
  const raw = await redis.get(feedKey(userId, limit));
  return raw
    ? {
        ...(JSON.parse(raw) as FeedResponse),
        cacheHit: true,
      }
    : null;
}

export async function setCachedFeed(
  userId: string,
  limit: number,
  feed: FeedResponse,
): Promise<void> {
  const redis = await getRedis();
  await redis.set(
    feedKey(userId, limit),
    JSON.stringify(feed),
    'EX',
    config.feedCacheTtlSeconds,
  );
}

export async function invalidateUserFeed(userId: string): Promise<void> {
  const redis = await getRedis();
  const keys = await redis.keys(`feed:user:${userId}:*`);
  await redis.del(...keys, `feed:user:${userId}`);
}

export async function acquireFeedLock(userId: string): Promise<string | null> {
  const redis = await getRedis();
  const token = randomUUID();
  const result = await redis.set(feedLockKey(userId), token, 'PX', 5_000, 'NX');
  return result === 'OK' ? token : null;
}

export async function releaseFeedLock(
  userId: string,
  token: string,
): Promise<void> {
  const redis = await getRedis();
  await redis.eval(
    `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    end
    return 0
    `,
    1,
    feedLockKey(userId),
    token,
  );
}

export async function waitForCachedFeed(
  userId: string,
  limit: number,
  attempts = 5,
  delayMs = 50,
): Promise<FeedResponse | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    const cached = await getCachedFeed(userId, limit);
    if (cached) return cached;
  }

  return null;
}

export async function getCachedTrending<T>(
  substackId: string | null = null,
): Promise<T[] | null> {
  const redis = await getRedis();
  const raw = await redis.get(trendingKey(substackId));
  return raw ? (JSON.parse(raw) as T[]) : null;
}

export async function setCachedTrending<T>(
  items: T[],
  substackId: string | null = null,
): Promise<void> {
  const redis = await getRedis();
  const ttl = substackId
    ? Math.min(config.trendingCacheTtlSeconds * 2, 120)
    : config.trendingCacheTtlSeconds;
  await redis.set(trendingKey(substackId), JSON.stringify(items), 'EX', ttl);
}

export async function invalidateTrending(): Promise<void> {
  const redis = await getRedis();
  const keys = await redis.keys('trending:*');
  if (keys.length > 0) await redis.del(...keys);
}

export async function getCachedUserSubscriptions(
  userId: string,
): Promise<Set<string> | null> {
  const redis = await getRedis();
  const ids = await redis.smembers(userSubsKey(userId));
  if (ids.length === 0) return null;
  return new Set(ids);
}

export async function setCachedUserSubscriptions(
  userId: string,
  substackIds: Iterable<string>,
): Promise<void> {
  const redis = await getRedis();
  const key = userSubsKey(userId);
  const pipeline = redis.pipeline();
  pipeline.del(key);

  const ids = [...substackIds];
  if (ids.length > 0) {
    pipeline.sadd(key, ...ids);
  }

  pipeline.expire(key, config.userSubsCacheTtlSeconds);
  await pipeline.exec();
}

export async function invalidateUserSubscriptions(
  userId: string,
): Promise<void> {
  const redis = await getRedis();
  await redis.del(userSubsKey(userId));
}
