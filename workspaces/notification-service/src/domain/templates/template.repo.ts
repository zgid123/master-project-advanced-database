import type { PgClient } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import type { CategoryRow, ChannelCode, ChannelRow, TemplateRow } from './template.types.js';

export const TemplateRepo = {
  async categoryByCode(code: string, client: PgClient | typeof pool = pool): Promise<CategoryRow | null> {
    const result = await client.query<CategoryRow>({
      name: 'category-by-code',
      text: `
        SELECT id, code, display_name, default_channels, importance, is_transactional
        FROM notification_categories
        WHERE code = $1
      `,
      values: [code],
    });

    return result.rows[0] ?? null;
  },

  async channelsByIds(ids: number[], client: PgClient | typeof pool = pool): Promise<ChannelRow[]> {
    if (ids.length === 0) return [];

    const result = await client.query<ChannelRow>({
      name: 'channels-by-ids',
      text: `
        SELECT id, code, display_name
        FROM notification_channels
        WHERE id = ANY($1::smallint[])
          AND is_active = true
        ORDER BY id
      `,
      values: [ids],
    });

    return result.rows;
  },

  async activeTemplate(
    categoryId: number,
    channelCode: ChannelCode,
    locale: string,
    client: PgClient | typeof pool = pool,
  ): Promise<TemplateRow | null> {
    const result = await client.query<TemplateRow>({
      name: 'active-template-by-category-channel-locale',
      text: `
        SELECT t.id, t.category_id, t.channel_id, t.locale, t.subject, t.body, t.body_html
        FROM notification_templates t
        JOIN notification_channels c ON c.id = t.channel_id
        WHERE t.category_id = $1
          AND c.code = $2
          AND t.locale IN ($3, 'en')
          AND t.is_active = true
        ORDER BY CASE WHEN t.locale = $3 THEN 0 ELSE 1 END, t.version DESC
        LIMIT 1
      `,
      values: [categoryId, channelCode, locale],
    });

    return result.rows[0] ?? null;
  },
};
