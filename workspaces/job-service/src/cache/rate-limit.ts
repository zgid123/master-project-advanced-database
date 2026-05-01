import { HttpError } from '../domain/errors.js';
import { logger } from '../observability/logger.js';
import { getRedis } from './redis.js';

let warnedRateLimitFailure = false;

export async function rateLimitApply(
  userId: string,
  limit = 10,
  windowSeconds = 60,
): Promise<void> {
  try {
    const client = await getRedis();
    const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
    const key = `rate:apply:${userId}:${bucket}`;
    const count = await client.incr(key);

    if (count === 1) {
      await client.expire(key, windowSeconds);
    }

    if (count > limit) {
      throw new HttpError(429, 'RATE_LIMITED', 'Too many application submissions');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (!warnedRateLimitFailure) {
      warnedRateLimitFailure = true;
      logger.warn({ error }, 'redis rate limit failed open');
    }
  }
}
