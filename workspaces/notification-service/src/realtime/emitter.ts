import { Emitter } from '@socket.io/redis-emitter';
import { getRedis } from '../cache/redis.js';
import { logger } from '../observability/logger.js';

export type RealtimeNotificationPayload = {
  id: string;
  title: string;
  body: string;
  category_code: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

export async function emitNotificationNew(
  userId: string,
  payload: RealtimeNotificationPayload,
): Promise<void> {
  try {
    const redis = await getRedis();
    const emitter = new Emitter(redis);
    emitter.to(`user:${userId}`).emit('notification:new', payload);
  } catch (error) {
    logger.warn({ error, userId }, 'realtime emit failed');
  }
}
