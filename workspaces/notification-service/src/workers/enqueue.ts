import type { ChannelCode } from '../domain/templates/template.types.js';
import { deliveryQueues } from './queues.js';

export type DeliveryJobData = {
  notification_id: string;
  notification_created_at: string;
  public_id: string;
  user_id: string;
  channel_code: Exclude<ChannelCode, 'in_app'>;
  category_code: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
};

const queueByChannel = {
  email: deliveryQueues.email,
  web_push: deliveryQueues.web_push,
  mobile_push: deliveryQueues.mobile_push,
  sms: deliveryQueues.sms,
} as const;

export async function enqueueDelivery(data: DeliveryJobData): Promise<void> {
  const queue = queueByChannel[data.channel_code];
  const jobId = `${data.channel_code}:${data.notification_id}:${data.notification_created_at}`;

  await queue.add(data.channel_code, data, {
    jobId,
    attempts: data.channel_code === 'sms' ? 5 : 8,
    backoff: {
      type: 'exponential',
      delay: 1_000,
    },
    removeOnComplete: {
      age: 86_400,
      count: 10_000,
    },
    removeOnFail: {
      age: 604_800,
      count: 10_000,
    },
  });
}
