import { z } from 'zod';

export const devicePlatforms = ['ios', 'android', 'web'] as const;

export const registerDeviceSchema = z.object({
  platform: z.enum(devicePlatforms),
  token: z.string().min(12).max(4096),
  app_version: z.string().max(80).nullable().optional(),
  device_info: z.record(z.string(), z.unknown()).default({}).refine(
    (value) => Buffer.byteLength(JSON.stringify(value), 'utf8') <= 1024,
    'device_info must be at most 1KB when serialized',
  ),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema> & {
  user_id: string;
};

export type DeviceTokenRow = {
  id: string;
  user_id: string;
  platform: (typeof devicePlatforms)[number];
  token: string;
  app_version: string | null;
  device_info: Record<string, unknown>;
  last_seen_at: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};
