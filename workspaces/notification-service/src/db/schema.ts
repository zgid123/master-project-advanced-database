import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const notificationChannels = pgTable('notification_channels', {
  id: smallint('id').primaryKey(),
  code: text('code').notNull(),
  displayName: text('display_name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notificationCategories = pgTable('notification_categories', {
  id: smallint('id').primaryKey(),
  code: text('code').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  defaultChannels: smallint('default_channels').array().notNull().default(sql`ARRAY[1]::SMALLINT[]`),
  importance: smallint('importance').notNull().default(50),
  isTransactional: boolean('is_transactional').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notificationTemplates = pgTable('notification_templates', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
  categoryId: smallint('category_id').notNull(),
  channelId: smallint('channel_id').notNull(),
  locale: text('locale').notNull().default('en'),
  version: integer('version').notNull().default(1),
  subject: text('subject'),
  body: text('body').notNull(),
  bodyHtml: text('body_html'),
  variables: jsonb('variables').$type<Record<string, unknown>>().notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  userId: bigint('user_id', { mode: 'bigint' }).notNull(),
  categoryId: smallint('category_id').notNull(),
  channelId: smallint('channel_id').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  quietHoursStart: smallint('quiet_hours_start'),
  quietHoursEnd: smallint('quiet_hours_end'),
  timezone: text('timezone').notNull().default('UTC'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.categoryId, table.channelId] }),
}));

export const deviceTokens = pgTable('device_tokens', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint('user_id', { mode: 'bigint' }).notNull(),
  platform: text('platform').notNull(),
  token: text('token').notNull(),
  appVersion: text('app_version'),
  deviceInfo: jsonb('device_info').$type<Record<string, unknown>>().notNull().default({}),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: bigint('id', { mode: 'bigint' }).generatedAlwaysAsIdentity().notNull(),
  publicId: uuid('public_id').defaultRandom().notNull(),
  userId: bigint('user_id', { mode: 'bigint' }).notNull(),
  categoryId: smallint('category_id').notNull(),
  templateId: bigint('template_id', { mode: 'bigint' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  read: boolean('read').notNull().default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  archived: boolean('archived').notNull().default(false),
  sourceService: text('source_service'),
  sourceType: text('source_type'),
  sourceId: bigint('source_id', { mode: 'bigint' }),
  actorUserId: bigint('actor_user_id', { mode: 'bigint' }),
  dedupKey: text('dedup_key'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.id, table.createdAt] }),
}));

export const notificationDeliveries = pgTable('notification_deliveries', {
  id: bigint('id', { mode: 'bigint' }).generatedAlwaysAsIdentity().notNull(),
  notificationId: bigint('notification_id', { mode: 'bigint' }).notNull(),
  notificationCreatedAt: timestamp('notification_created_at', { withTimezone: true }).notNull(),
  userId: bigint('user_id', { mode: 'bigint' }).notNull(),
  channelId: smallint('channel_id').notNull(),
  status: smallint('status').notNull(),
  attempt: smallint('attempt').notNull().default(1),
  provider: text('provider'),
  providerMsgId: text('provider_msg_id'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  requestPayload: jsonb('request_payload').$type<Record<string, unknown> | null>(),
  responsePayload: jsonb('response_payload').$type<Record<string, unknown> | null>(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.id, table.createdAt] }),
}));
