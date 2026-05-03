import { pool } from '../../db/pool.js';
import { HttpError } from '../errors.js';
import type { DeviceTokenRow, RegisterDeviceInput } from './device.types.js';

export const DeviceRepo = {
  async listForUser(userId: string): Promise<DeviceTokenRow[]> {
    const result = await pool.query<DeviceTokenRow>({
      name: 'device-list-for-user',
      text: `
        SELECT *
        FROM device_tokens
        WHERE user_id = $1
          AND is_active = true
        ORDER BY last_seen_at DESC, id DESC
      `,
      values: [userId],
    });

    return result.rows;
  },

  async register(input: RegisterDeviceInput): Promise<DeviceTokenRow> {
    const result = await pool.query<DeviceTokenRow>({
      name: 'device-register-upsert',
      text: `
        INSERT INTO device_tokens(user_id, platform, token, app_version, device_info, is_active, last_seen_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, true, now())
        ON CONFLICT (platform, token) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            app_version = EXCLUDED.app_version,
            device_info = EXCLUDED.device_info,
            is_active = true,
            last_seen_at = now()
        RETURNING *
      `,
      values: [
        input.user_id,
        input.platform,
        input.token,
        input.app_version ?? null,
        JSON.stringify(input.device_info),
      ],
    });

    const row = result.rows[0];
    if (!row) throw new HttpError(500, 'DEVICE_REGISTER_FAILED', 'Device registration did not return a row');
    return row;
  },

  async deactivate(userId: string, id: string): Promise<boolean> {
    const result = await pool.query({
      name: 'device-deactivate',
      text: `
        UPDATE device_tokens
        SET is_active = false
        WHERE id = $1
          AND user_id = $2
          AND is_active = true
      `,
      values: [id, userId],
    });

    return (result.rowCount ?? 0) > 0;
  },
};
