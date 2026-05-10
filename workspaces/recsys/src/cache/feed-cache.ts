import { config } from '../config.js';
import type { FeedResponse } from '../recommendation/types.js';
import { getRedis } from './redis.js';

const feedKey = (userId: string) => `feed:${userId}`;
const trendingKey = 'trending:global';
const userSubsKey = (userId: string) => `user:subs:${userId}`;
const popularityKey = (topicId: string) => `popularity:${topicId}`;

export async function getCachedFeed(
  userId: string,
): Promise<FeedResponse | null> {
  const redis = await getRedis();
  const raw = await redis.get(feedKey(userId));
  return raw ? (JSON.parse(raw) as FeedResponse) : null;
}

export async function setCachedFeed(
  userId: string,
  feed: FeedResponse,
): Promise<void> {
  const redis = await getRedis();
  await redis.set(
    feedKey(userId),
    JSON.stringify(feed),
    'EX',
    config.feedCacheTtlSeconds,
  );
}

export async function invalidateUserFeed(userId: string): Promise<void> {
  const redis = await getRedis();
  await redis.del(feedKey(userId));
}

export async function getCachedTrending<T>(): Promise<T[] | null> {
  const redis = await getRedis();
  const raw = await redis.get(trendingKey);
  return raw ? (JSON.parse(raw) as T[]) : null;
}

export async function setCachedTrending<T>(items: T[]): Promise<void> {
  const redis = await getRedis();
  await redis.set(
    trendingKey,
    JSON.stringify(items),
    'EX',
    config.trendingCacheTtlSeconds,
  );
}

export async function invalidateTrending(): Promise<void> {
  const redis = await getRedis();
  await redis.del(trendingKey);
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

export async function setCachedPopularity(
  topicId: string,
  score: number,
): Promise<void> {
  const redis = await getRedis();
  await redis.set(
    popularityKey(topicId),
    String(score),
    'EX',
    config.popularityCacheTtlSeconds,
  );
}
