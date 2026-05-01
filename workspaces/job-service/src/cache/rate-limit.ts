import { HttpError } from '../domain/errors.js';
import { getRedis } from './redis.js';

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
  }
}
