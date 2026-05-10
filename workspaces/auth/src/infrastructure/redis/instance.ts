import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

let connectionAttempt: Promise<Redis> | null = null;

export async function getRedis(): Promise<Redis> {
  if (redis.status === 'ready') {
    return redis;
  }

  if (connectionAttempt) {
    return connectionAttempt;
  }

  connectionAttempt = redis
    .connect()
    .then(() => {
      return redis;
    })
    .finally(() => {
      connectionAttempt = null;
    });

  return connectionAttempt;
}
