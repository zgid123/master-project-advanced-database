import type { ObjectId } from 'mongodb';
import { z } from 'zod';

export const applicationStatuses = [
  'submitted',
  'reviewing',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

const metadataSchema = z.record(z.string(), z.unknown());

export const submitApplicationSchema = z.object({
  coverLetter: z.string().max(5_000).nullable().optional(),
  resumeUrl: z.string().url().max(500).nullable().optional(),
  metadata: metadataSchema.default({}),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(applicationStatuses),
  expectedStatus: z.enum(applicationStatuses),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema> & {
  jobId: string;
  applicantUserId: string;
  idempotencyKey: string;
};

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

export type ApplicationDoc = {
  _id: ObjectId;
  jobId: ObjectId;
  applicantUserId: ObjectId;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  idempotencyKey?: string;
  denormalized?: {
    jobTitle?: string;
    jobPostedByUserId?: ObjectId;
  };
  metadata: Record<string, unknown>;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationResponse = {
  id: string;
  jobId: string;
  applicantUserId: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  resumeUrl: string | null;
  idempotencyKey: string | null;
  denormalized: {
    jobTitle: string | null;
    jobPostedByUserId: string | null;
  };
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type UserApplicationResponse = Pick<
  ApplicationResponse,
  'id' | 'jobId' | 'status' | 'denormalized' | 'createdAt' | 'updatedAt'
>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeApplication(doc: ApplicationDoc): ApplicationResponse {
  return {
    id: doc._id.toHexString(),
    jobId: doc.jobId.toHexString(),
    applicantUserId: doc.applicantUserId.toHexString(),
    status: doc.status,
    coverLetter: doc.coverLetter ?? null,
    resumeUrl: doc.resumeUrl ?? null,
    idempotencyKey: doc.idempotencyKey ?? null,
    denormalized: {
      jobTitle: doc.denormalized?.jobTitle ?? null,
      jobPostedByUserId: doc.denormalized?.jobPostedByUserId?.toHexString() ?? null,
    },
    metadata: doc.metadata,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeUserApplication(doc: ApplicationDoc): UserApplicationResponse {
  const serialized = serializeApplication(doc);
  return {
    id: serialized.id,
    jobId: serialized.jobId,
    status: serialized.status,
    denormalized: serialized.denormalized,
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt,
  };
}
