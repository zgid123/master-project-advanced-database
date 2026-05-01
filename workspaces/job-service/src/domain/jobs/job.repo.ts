import type { PgClient } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import type { KeysetCursor } from '../pagination.js';
import type { CreateJobInput, JobListRow, JobRow, JobSearchRow, JobStatus, UpdateJobInput } from './job.types.js';

type JobMutationTarget = Pick<JobRow, 'id' | 'posted_by_user_id' | 'status'>;

const updateColumnMap = {
  name: 'name',
  slug: 'slug',
  content: 'content',
  status: 'status',
  job_type: 'job_type',
  location: 'location',
  salary_min: 'salary_min',
  salary_max: 'salary_max',
  currency: 'currency',
  tags: 'tags',
  metadata: 'metadata',
  valid_to: 'valid_to',
} as const;

export const JobRepo = {
  async findById(id: string, client: PgClient | typeof pool = pool): Promise<JobRow | null> {
    const result = await client.query<JobRow>({
      name: 'job-by-id',
      text: 'SELECT * FROM jobs WHERE id = $1 AND deleted_at IS NULL',
      values: [id],
    });

    return result.rows[0] ?? null;
  },

  async findMutationTarget(id: string, client: PgClient): Promise<JobMutationTarget | null> {
    const result = await client.query<JobMutationTarget>({
      name: 'job-mutation-target-for-update',
      text: `
        SELECT id, posted_by_user_id, status
        FROM jobs
        WHERE id = $1
          AND deleted_at IS NULL
        FOR UPDATE
      `,
      values: [id],
    });

    return result.rows[0] ?? null;
  },

  async listOpenKeyset(cursor: KeysetCursor | null, limit: number): Promise<JobListRow[]> {
    const values: unknown[] = [];
    let cursorFilter = '';

    if (cursor) {
      values.push(cursor.createdAt, cursor.id);
      cursorFilter = 'AND (created_at, id) < ($1::timestamptz, $2::bigint)';
    }

    values.push(limit);
    const limitParam = values.length;

    const result = await pool.query<JobListRow>({
      name: cursor ? 'job-list-open-keyset-cursor' : 'job-list-open-keyset-first',
      text: `
        SELECT id, name, slug, location, salary_min, salary_max,
               currency, application_count, created_at
        FROM jobs
        WHERE deleted_at IS NULL
          AND status = 'open'
          ${cursorFilter}
        ORDER BY created_at DESC, id DESC
        LIMIT $${limitParam}
      `,
      values,
    });

    return result.rows;
  },

  async fullTextSearch(
    q: string,
    location: string | null,
    type: string | null,
    limit: number,
  ): Promise<JobSearchRow[]> {
    const result = await pool.query<JobSearchRow>({
      name: 'job-full-text-search',
      text: `
        SELECT id, name, slug, location, created_at, ts_rank(search_vector, query) AS rank
        FROM jobs, plainto_tsquery('simple', $1) AS query
        WHERE deleted_at IS NULL
          AND status = 'open'
          AND search_vector @@ query
          AND ($2::text IS NULL OR location ILIKE '%' || $2 || '%')
          AND ($3::job_type IS NULL OR job_type = $3::job_type)
        ORDER BY rank DESC, created_at DESC, id DESC
        LIMIT $4
      `,
      values: [q, location, type, limit],
    });

    return result.rows;
  },

  async create(input: CreateJobInput, client: PgClient | typeof pool = pool): Promise<JobRow> {
    const result = await client.query<JobRow>({
      name: 'job-create',
      text: `
        INSERT INTO jobs (
          posted_by_user_id, name, slug, content, status, job_type, location,
          salary_min, salary_max, currency, tags, metadata, valid_to
        )
        VALUES (
          $1, $2, $3, $4, $5::job_status, $6::job_type, $7,
          $8, $9, $10, $11::text[], $12::jsonb, $13::timestamptz
        )
        RETURNING *
      `,
      values: [
        input.posted_by_user_id,
        input.name,
        input.slug,
        input.content,
        input.status,
        input.job_type ?? null,
        input.location ?? null,
        input.salary_min ?? null,
        input.salary_max ?? null,
        input.currency ?? null,
        input.tags,
        JSON.stringify(input.metadata),
        input.valid_to ?? null,
      ],
    });

    return result.rows[0] as JobRow;
  },

  async updateCAS(
    id: string,
    patch: UpdateJobInput,
    client: PgClient | typeof pool = pool,
  ): Promise<JobRow | null> {
    const entries = Object.entries(patch).filter(([key]) => key !== 'expected_status') as Array<
      [keyof typeof updateColumnMap, unknown]
    >;
    const values: unknown[] = [];
    const setClauses = entries.map(([key, value], index) => {
      values.push(key === 'metadata' ? JSON.stringify(value) : value);
      return `${updateColumnMap[key]} = $${index + 1}`;
    });

    values.push(id);
    const idParam = values.length;
    let expectedStatusFilter = '';

    if (patch.expected_status) {
      values.push(patch.expected_status);
      expectedStatusFilter = `AND status = $${values.length}::job_status`;
    }

    const result = await client.query<JobRow>({
      name: 'job-update-cas',
      text: `
        UPDATE jobs
        SET ${setClauses.join(', ')}
        WHERE id = $${idParam}
          AND deleted_at IS NULL
          ${expectedStatusFilter}
        RETURNING *
      `,
      values,
    });

    return result.rows[0] ?? null;
  },

  async appendEvent(
    client: PgClient,
    eventType: 'job.created' | 'job.updated' | 'job.closed',
    payload: Record<string, unknown>,
  ): Promise<void> {
    await client.query({
      name: 'outbox-append-job-event',
      text: 'INSERT INTO event_outbox(event_type, payload) VALUES ($1, $2::jsonb)',
      values: [eventType, JSON.stringify(payload)],
    });
  },
};

export function isTerminalStatus(status: JobStatus): boolean {
  return ['closed', 'filled', 'expired', 'archived'].includes(status);
}
