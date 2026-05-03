import { z } from 'zod';

export const applicationStatuses = [
  'submitted',
  'under_review',
  'shortlisted',
  'interviewed',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

const metadataSchema = z.record(z.string(), z.unknown());

export const submitApplicationSchema = z.object({
  cover_letter: z.string().max(10_000).nullable().optional(),
  resume_url: z.string().url().nullable().optional(),
  content: z.string().max(10_000).nullable().optional(),
  metadata: metadataSchema.default({}),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(applicationStatuses),
  expected_status: z.enum(applicationStatuses),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema> & {
  job_id: string;
  applicant_user_id: string;
  idempotency_key: string;
};

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

export type ApplicationRow = {
  id: string;
  job_id: string;
  applicant_user_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  resume_url: string | null;
  content: string | null;
  metadata: Record<string, unknown>;
  idempotency_key: string | null;
  created_at: Date;
  updated_at: Date;
};

export type UserApplicationRow = Pick<
  ApplicationRow,
  'id' | 'job_id' | 'status' | 'created_at' | 'updated_at'
> & {
  job_name: string;
  job_slug: string;
};
