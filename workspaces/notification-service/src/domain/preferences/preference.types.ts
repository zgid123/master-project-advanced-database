import { z } from 'zod';

export const preferenceUpsertSchema = z.object({
  category_code: z.string().min(1),
  channel_code: z.enum(['in_app', 'email', 'web_push', 'mobile_push', 'sms']),
  enabled: z.boolean(),
  quiet_hours_start: z.number().int().min(0).max(23).nullable().optional(),
  quiet_hours_end: z.number().int().min(0).max(23).nullable().optional(),
  timezone: z.string().min(1).default('UTC'),
});

export const preferencePutSchema = z.object({
  preferences: z.array(preferenceUpsertSchema).min(1).max(200),
});

export type PreferenceUpsertInput = z.infer<typeof preferenceUpsertSchema>;

export type PreferenceRow = {
  user_id: string;
  category_id: number;
  category_code: string;
  channel_id: number;
  channel_code: string;
  enabled: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  timezone: string;
  updated_at: Date;
};
