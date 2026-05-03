import { pool } from '../../db/pool.js';
import type { ChannelCode } from '../templates/template.types.js';
import { deliveryStatus, type DeliveryAttemptRow, type DeliveryProviderResult } from './delivery.types.js';

export const DeliveryRepo = {
  async channelIdByCode(channelCode: Exclude<ChannelCode, 'in_app'>): Promise<number> {
    const result = await pool.query<{ id: number }>({
      name: 'delivery-channel-id-by-code',
      text: 'SELECT id FROM notification_channels WHERE code = $1 AND is_active = true',
      values: [channelCode],
    });

    const id = result.rows[0]?.id;
    if (!id) throw new Error(`Unknown delivery channel: ${channelCode}`);
    return id;
  },

  async startAttempt(input: {
    notification_id: string;
    notification_created_at: string;
    user_id: string;
    channel_id: number;
    attempt: number;
    request_payload: Record<string, unknown>;
  }): Promise<DeliveryAttemptRow> {
    const result = await pool.query<DeliveryAttemptRow>({
      name: 'delivery-start-attempt',
      text: `
        INSERT INTO notification_deliveries(
          notification_id, notification_created_at, user_id, channel_id,
          status, attempt, request_payload
        )
        VALUES ($1, $2::timestamptz, $3, $4, $5, $6, $7::jsonb)
        RETURNING id, created_at
      `,
      values: [
        input.notification_id,
        input.notification_created_at,
        input.user_id,
        input.channel_id,
        deliveryStatus.sending,
        input.attempt,
        JSON.stringify(input.request_payload),
      ],
    });

    return result.rows[0] as DeliveryAttemptRow;
  },

  async finishAttempt(
    attempt: DeliveryAttemptRow,
    result: DeliveryProviderResult,
  ): Promise<void> {
    await pool.query({
      name: 'delivery-finish-attempt',
      text: `
        UPDATE notification_deliveries
        SET status = $3,
            provider = $4,
            provider_msg_id = $5,
            error_code = $6,
            error_message = $7,
            response_payload = $8::jsonb,
            sent_at = CASE WHEN $3 IN (2, 3, 4, 5) THEN now() ELSE sent_at END,
            delivered_at = CASE WHEN $3 = 3 THEN now() ELSE delivered_at END
        WHERE id = $1
          AND created_at = $2::timestamptz
      `,
      values: [
        attempt.id,
        attempt.created_at,
        result.status,
        result.provider,
        result.provider_msg_id ?? null,
        result.error_code ?? null,
        result.error_message ?? null,
        JSON.stringify(result.response_payload ?? null),
      ],
    });
  },
};
