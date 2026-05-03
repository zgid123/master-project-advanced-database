import { Emitter } from '@socket.io/redis-emitter';
import { Redis } from 'ioredis';
import { config } from '../config.js';
import { logger } from '../observability/logger.js';

const pub = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

let emitter: Emitter | null = null;
let connectionAttempt: Promise<Emitter> | null = null;

async function getEmitter(): Promise<Emitter> {
  if (emitter && pub.status === 'ready') return emitter;
  if (connectionAttempt) return connectionAttempt;

  connectionAttempt = pub
    .connect()
    .catch((error: unknown) => {
      if (pub.status !== 'ready') throw error;
    })
    .then(() => {
      emitter = new Emitter(pub);
      return emitter;
    })
    .finally(() => {
      connectionAttempt = null;
    });

  return connectionAttempt;
}

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
    const socketEmitter = await getEmitter();
    socketEmitter.to(`user:${userId}`).emit('notification:new', payload);
  } catch (error) {
    logger.warn({ error, userId }, 'realtime emit failed');
  }
}
