import type { ChannelCode } from '../templates/template.types.js';

export const deliveryStatus = {
  queued: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
  failed: 6,
  skipped: 7,
} as const;

export type DeliveryStatusCode = (typeof deliveryStatus)[keyof typeof deliveryStatus];

export type DeliveryAttemptRow = {
  id: string;
  created_at: Date;
};

export type DeliveryProviderResult = {
  status: DeliveryStatusCode;
  provider: string;
  provider_msg_id?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  request_payload?: Record<string, unknown> | null;
  response_payload?: Record<string, unknown> | null;
};

export type DeliveryJobPayload = {
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
