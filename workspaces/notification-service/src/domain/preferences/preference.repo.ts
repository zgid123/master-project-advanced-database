import type { PgClient } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { HttpError } from '../errors.js';
import type { PreferenceRow, PreferenceUpsertInput } from './preference.types.js';

export const PreferenceRepo = {
  async listForUser(userId: string, client: PgClient | typeof pool = pool): Promise<PreferenceRow[]> {
    const result = await client.query<PreferenceRow>({
      name: 'preferences-list-for-user',
      text: `
        SELECT p.user_id, p.category_id, c.code AS category_code,
               p.channel_id, ch.code AS channel_code, p.enabled,
               p.quiet_hours_start, p.quiet_hours_end, p.timezone, p.updated_at
        FROM notification_preferences p
        JOIN notification_categories c ON c.id = p.category_id
        JOIN notification_channels ch ON ch.id = p.channel_id
        WHERE p.user_id = $1
        ORDER BY c.code, ch.id
      `,
      values: [userId],
    });

    return result.rows;
  },

  async upsertMany(
    userId: string,
    preferences: PreferenceUpsertInput[],
    client: PgClient | typeof pool = pool,
  ): Promise<PreferenceRow[]> {
    for (const preference of preferences) {
      const result = await client.query<{ category_id: number; channel_id: number }>({
        name: 'preferences-resolve-category-channel',
        text: `
          SELECT c.id AS category_id, ch.id AS channel_id
          FROM notification_categories c
          CROSS JOIN notification_channels ch
          WHERE c.code = $1
            AND ch.code = $2
            AND ch.is_active = true
        `,
        values: [preference.category_code, preference.channel_code],
      });

      const target = result.rows[0];
      if (!target) {
        throw new HttpError(400, 'UNKNOWN_PREFERENCE_TARGET', 'Category or channel is not known');
      }

      await client.query({
        name: 'preferences-upsert-one',
        text: `
          INSERT INTO notification_preferences(
            user_id, category_id, channel_id, enabled, quiet_hours_start, quiet_hours_end, timezone
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id, category_id, channel_id) DO UPDATE
          SET enabled = EXCLUDED.enabled,
              quiet_hours_start = EXCLUDED.quiet_hours_start,
              quiet_hours_end = EXCLUDED.quiet_hours_end,
              timezone = EXCLUDED.timezone
        `,
        values: [
          userId,
          target.category_id,
          target.channel_id,
          preference.enabled,
          preference.quiet_hours_start ?? null,
          preference.quiet_hours_end ?? null,
          preference.timezone,
        ],
      });
    }

    return this.listForUser(userId, client);
  },

  async channelPrefsForUserCategory(
    userId: string,
    categoryId: number,
    client: PgClient | typeof pool = pool,
  ): Promise<Array<Pick<PreferenceRow, 'channel_id' | 'channel_code' | 'enabled' | 'quiet_hours_start' | 'quiet_hours_end' | 'timezone'>>> {
    const result = await client.query<Array<Pick<PreferenceRow, 'channel_id' | 'channel_code' | 'enabled' | 'quiet_hours_start' | 'quiet_hours_end' | 'timezone'>>[number]>({
      name: 'preferences-for-user-category',
      text: `
        SELECT p.channel_id, ch.code AS channel_code, p.enabled,
               p.quiet_hours_start, p.quiet_hours_end, p.timezone
        FROM notification_preferences p
        JOIN notification_channels ch ON ch.id = p.channel_id
        WHERE p.user_id = $1
          AND p.category_id = $2
      `,
      values: [userId, categoryId],
    });

    return result.rows;
  },

  async channelPrefsForUsersCategory(
    userIds: string[],
    categoryId: number,
    client: PgClient | typeof pool = pool,
  ): Promise<Array<Pick<PreferenceRow, 'user_id' | 'channel_id' | 'channel_code' | 'enabled' | 'quiet_hours_start' | 'quiet_hours_end' | 'timezone'>>> {
    if (userIds.length === 0) return [];

    const result = await client.query<Array<Pick<PreferenceRow, 'user_id' | 'channel_id' | 'channel_code' | 'enabled' | 'quiet_hours_start' | 'quiet_hours_end' | 'timezone'>>[number]>({
      name: 'preferences-for-users-category',
      text: `
        SELECT p.user_id, p.channel_id, ch.code AS channel_code, p.enabled,
               p.quiet_hours_start, p.quiet_hours_end, p.timezone
        FROM notification_preferences p
        JOIN notification_channels ch ON ch.id = p.channel_id
        WHERE p.user_id = ANY($1::bigint[])
          AND p.category_id = $2
      `,
      values: [userIds, categoryId],
    });

    return result.rows;
  },
};
