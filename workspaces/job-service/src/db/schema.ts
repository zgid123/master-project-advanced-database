import { sql } from 'drizzle-orm';
import {
  bigint,
  char,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const jobStatus = pgEnum('job_status', [
  'draft',
  'open',
  'closed',
  'filled',
  'expired',
  'archived',
]);

export const applicationStatus = pgEnum('application_status', [
  'submitted',
  'under_review',
  'shortlisted',
  'interviewed',
  'accepted',
  'rejected',
  'withdrawn',
]);

export const jobType = pgEnum('job_type', [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'freelance',
]);

export const jobs = pgTable('jobs', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
  publicUid: uuid('public_uid').notNull(),
  postedByUserId: bigint('posted_by_user_id', { mode: 'bigint' }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  content: text('content').notNull(),
  status: jobStatus('status').notNull().default('draft'),
  jobType: jobType('job_type'),
  location: text('location'),
  salaryMin: numeric('salary_min', { precision: 12, scale: 2 }),
  salaryMax: numeric('salary_max', { precision: 12, scale: 2 }),
  currency: char('currency', { length: 3 }),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  viewCount: bigint('view_count', { mode: 'bigint' }).notNull().default(0n),
  applicationCount: integer('application_count').notNull().default(0),
  validTo: timestamp('valid_to', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const jobApplications = pgTable('job_applications', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
  jobId: bigint('job_id', { mode: 'bigint' }).notNull(),
  applicantUserId: bigint('applicant_user_id', { mode: 'bigint' }).notNull(),
  status: applicationStatus('status').notNull().default('submitted'),
  coverLetter: text('cover_letter'),
  resumeUrl: text('resume_url'),
  content: text('content'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  idempotencyKey: text('idempotency_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const eventOutbox = pgTable('event_outbox', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  lastError: text('last_error'),
});
