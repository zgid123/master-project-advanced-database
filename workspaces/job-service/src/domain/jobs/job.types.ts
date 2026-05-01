import { z } from 'zod';

export const jobStatuses = [
  'draft',
  'open',
  'closed',
  'filled',
  'expired',
  'archived',
] as const;

export const jobTypes = [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'freelance',
] as const;

export type JobStatus = (typeof jobStatuses)[number];
export type JobType = (typeof jobTypes)[number];

const metadataSchema = z.record(z.string(), z.unknown());

export const createJobSchema = z.object({
  name: z.string().min(3).max(240),
  slug: z.string().regex(/^[a-z0-9-]{3,160}$/).optional(),
  content: z.string().min(1),
  status: z.enum(jobStatuses).default('draft'),
  job_type: z.enum(jobTypes).nullable().optional(),
  location: z.string().max(240).nullable().optional(),
  salary_min: z.coerce.number().nonnegative().nullable().optional(),
  salary_max: z.coerce.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()).nullable().optional(),
  tags: z.array(z.string().min(1).max(64)).default([]),
  metadata: metadataSchema.default({}),
  valid_to: z.string().datetime().nullable().optional(),
});

export const updateJobSchema = createJobSchema
  .partial()
  .extend({
    expected_status: z.enum(jobStatuses).optional(),
  })
  .refine((value) => Object.keys(value).some((key) => key !== 'expected_status'), {
    message: 'At least one field must be provided',
  });

export type CreateJobInput = z.infer<typeof createJobSchema> & {
  posted_by_user_id: string;
};

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export type JobRow = {
  id: string;
  public_uid: string;
  posted_by_user_id: string;
  name: string;
  slug: string;
  content: string;
  status: JobStatus;
  job_type: JobType | null;
  location: string | null;
  salary_min: string | null;
  salary_max: string | null;
  currency: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  view_count: string;
  application_count: number;
  valid_to: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type JobListRow = Pick<
  JobRow,
  | 'id'
  | 'name'
  | 'slug'
  | 'location'
  | 'salary_min'
  | 'salary_max'
  | 'currency'
  | 'application_count'
  | 'created_at'
>;

export type JobSearchRow = Pick<JobRow, 'id' | 'name' | 'slug' | 'location' | 'created_at'> & {
  rank: number;
};
