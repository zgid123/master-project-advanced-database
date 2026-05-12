import type { ObjectId } from 'mongodb';
import { z } from 'zod';

export const jobStatuses = ['draft', 'open', 'closed', 'archived'] as const;
export const jobTypes = ['full_time', 'part_time', 'contract', 'internship'] as const;

export type JobStatus = (typeof jobStatuses)[number];
export type JobType = (typeof jobTypes)[number];

const metadataSchema = z.record(z.string(), z.unknown());

const mutableJobFields = {
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(20_000),
  status: z.enum(jobStatuses),
  jobType: z.enum(jobTypes).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  tags: z.array(z.string().min(1).max(32)).max(16),
  metadata: metadataSchema,
} as const;

export const createJobSchema = z.object({
  ...mutableJobFields,
  status: mutableJobFields.status.default('draft'),
  tags: mutableJobFields.tags.default([]),
  metadata: mutableJobFields.metadata.default({}),
});

export const updateJobSchema = z.object(mutableJobFields)
  .partial()
  .extend({
    expectedStatus: z.enum(jobStatuses).optional(),
  })
  .refine((value) => Object.keys(value).some((key) => key !== 'expectedStatus'), {
    message: 'At least one field must be provided',
  });

export type CreateJobInput = z.infer<typeof createJobSchema> & {
  postedByUserId: string;
};

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export type JobDoc = {
  _id: ObjectId;
  postedByUserId: ObjectId;
  title: string;
  content: string;
  location?: string | null;
  jobType?: JobType | null;
  status: JobStatus;
  tags: string[];
  applicationCount: number;
  metadata: Record<string, unknown>;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type JobListDoc = Pick<
  JobDoc,
  '_id' | 'title' | 'location' | 'jobType' | 'status' | 'createdAt' | 'applicationCount'
>;

export type JobSearchDoc = JobListDoc & {
  score: number;
};

export type JobResponse = {
  id: string;
  postedByUserId: string;
  title: string;
  content: string;
  location: string | null;
  jobType: JobType | null;
  status: JobStatus;
  tags: string[];
  applicationCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type JobListResponse = Pick<
  JobResponse,
  'id' | 'title' | 'location' | 'jobType' | 'status' | 'applicationCount' | 'createdAt'
>;

export type JobSearchResponse = JobListResponse & {
  score: number;
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeJob(doc: JobDoc): JobResponse {
  return {
    id: doc._id.toHexString(),
    postedByUserId: doc.postedByUserId.toHexString(),
    title: doc.title,
    content: doc.content,
    location: doc.location ?? null,
    jobType: doc.jobType ?? null,
    status: doc.status,
    tags: doc.tags,
    applicationCount: doc.applicationCount,
    metadata: doc.metadata,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeJobListItem(doc: JobListDoc): JobListResponse {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    location: doc.location ?? null,
    jobType: doc.jobType ?? null,
    status: doc.status,
    applicationCount: doc.applicationCount,
    createdAt: toIso(doc.createdAt),
  };
}

export function serializeJobSearchItem(doc: JobSearchDoc): JobSearchResponse {
  return {
    ...serializeJobListItem(doc),
    score: doc.score,
  };
}
