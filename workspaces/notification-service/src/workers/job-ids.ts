import type { DeliveryJobData } from './enqueue.js';

export function deliveryJobId(
  data: Pick<DeliveryJobData, 'channel_code' | 'notification_id' | 'notification_created_at'>,
): string {
  const createdAtMs = Date.parse(data.notification_created_at);
  const createdAtToken = Number.isFinite(createdAtMs)
    ? String(createdAtMs)
    : data.notification_created_at.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return [data.channel_code, data.notification_id, createdAtToken].join('-');
}
