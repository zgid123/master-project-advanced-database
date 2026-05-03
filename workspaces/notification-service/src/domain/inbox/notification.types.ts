import { z } from 'zod';

export const notificationListFilterSchema = z.union([
  z.literal('all'),
  z.literal('unread'),
  z.string().regex(/^category:[a-z0-9_:-]+$/),
]).default('all');

export const createNotificationEventSchema = z.object({
  event_id: z.string().min(1).max(200),
  source_service: z.string().min(1).max(80),
  source_type: z.string().min(1).max(80).nullable().optional(),
  source_id: z.coerce.string().regex(/^\d+$/).nullable().optional(),
  actor_user_id: z.coerce.string().regex(/^\d+$/).nullable().optional(),
  category_code: z.string().min(1).max(120),
  locale: z.string().min(2).max(16).default('en'),
  recipients: z.array(z.object({
    user_id: z.coerce.string().regex(/^\d+$/),
  })).min(1).max(10_000),
  data: z.record(z.string(), z.unknown()).default({}),
  title: z.string().min(1).max(500).optional(),
  body: z.string().min(1).max(4000).optional(),
  dedup_key_prefix: z.string().min(1).max(300).optional(),
});

export type CreateNotificationEventInput = z.infer<typeof createNotificationEventSchema>;

export type NotificationRow = {
  id: string;
  public_id: string;
  user_id: string;
  category_id: number;
  category_code: string;
  template_id: string | null;
  title: string;
  body: string;
  read: boolean;
  read_at: Date | null;
  archived: boolean;
  source_service: string | null;
  source_type: string | null;
  source_id: string | null;
  actor_user_id: string | null;
  dedup_key: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type InsertNotificationInput = {
  user_id: string;
  category_id: number;
  template_id: string | null;
  title: string;
  body: string;
  source_service: string;
  source_type: string | null;
  source_id: string | null;
  actor_user_id: string | null;
  dedup_key: string | null;
  metadata: Record<string, unknown>;
};

export type CreatedNotification = Pick<
  NotificationRow,
  | 'id'
  | 'public_id'
  | 'user_id'
  | 'category_id'
  | 'category_code'
  | 'title'
  | 'body'
  | 'metadata'
  | 'created_at'
>;
