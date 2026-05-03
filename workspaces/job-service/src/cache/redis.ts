import { Redis } from 'ioredis';
import { config } from '../config.js';
import { logger } from '../observability/logger.js';

export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

redis.on('error', (error: Error) => {
  logger.warn({ error }, 'redis client error');
});

let connectionAttempt: Promise<Redis> | null = null;

export async function getRedis(): Promise<Redis> {
  if (redis.status === 'ready') return redis;
  if (connectionAttempt) return connectionAttempt;

  connectionAttempt = redis
    .connect()
    .then(() => redis)
    .finally(() => {
      connectionAttempt = null;
    });

  return connectionAttempt;
}
