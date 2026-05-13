import { HttpError } from '../domain/errors.js';
import { logger } from '../observability/logger.js';
import { getRedis } from './redis.js';

let warnedRateLimitFailure = false;

const tokenBucketLua = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local refill_per_second = tonumber(ARGV[3])
local ttl_seconds = tonumber(ARGV[4])

local current = redis.call('HMGET', key, 'tokens', 'updatedAt')
local tokens = tonumber(current[1]) or capacity
local updated_at = tonumber(current[2]) or now
local elapsed = math.max(0, now - updated_at)

tokens = math.min(capacity, tokens + (elapsed * refill_per_second))

if tokens < 1 then
  redis.call('HSET', key, 'tokens', tokens, 'updatedAt', now)
  redis.call('EXPIRE', key, ttl_seconds)
  return 0
end

tokens = tokens - 1
redis.call('HSET', key, 'tokens', tokens, 'updatedAt', now)
redis.call('EXPIRE', key, ttl_seconds)
return 1
`;

export async function rateLimitApply(
  userId: string,
  limit = 10,
  windowSeconds = 60,
): Promise<void> {
  try {
    const client = await getRedis();
    const key = `rate:apply:${userId}`;
    const allowed = await client.eval(
      tokenBucketLua,
      1,
      key,
      (Date.now() / 1000).toString(),
      limit.toString(),
      (limit / windowSeconds).toString(),
      (windowSeconds * 2).toString(),
    );

    if (allowed !== 1) {
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
