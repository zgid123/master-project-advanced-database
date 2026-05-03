import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config.js';

export const queueNames = {
  create: 'q.notification.create',
  email: 'q.notification.email',
  webPush: 'q.notification.web_push',
  mobilePush: 'q.notification.mobile_push',
  sms: 'q.notification.sms',
  digest: 'q.notification.digest',
} as const;

export function bullConnection(): Redis {
  return new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

const connection = bullConnection();

export const createNotificationQueue = new Queue(queueNames.create, { connection });
export const emailQueue = new Queue(queueNames.email, { connection });
export const webPushQueue = new Queue(queueNames.webPush, { connection });
export const mobilePushQueue = new Queue(queueNames.mobilePush, { connection });
export const smsQueue = new Queue(queueNames.sms, { connection });
export const digestQueue = new Queue(queueNames.digest, { connection });

export const deliveryQueues = {
  email: emailQueue,
  web_push: webPushQueue,
  mobile_push: mobilePushQueue,
  sms: smsQueue,
} as const;
