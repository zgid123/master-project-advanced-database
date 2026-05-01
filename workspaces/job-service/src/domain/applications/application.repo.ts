import type { PgClient } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import type { KeysetCursor } from '../pagination.js';
import type {
  ApplicationRow,
  ApplicationStatus,
  SubmitApplicationInput,
  UserApplicationRow,
} from './application.types.js';

export const ApplicationRepo = {
  async findByIdempotency(
    applicantUserId: string,
    idempotencyKey: string,
  ): Promise<ApplicationRow | null> {
    const result = await pool.query<ApplicationRow>({
      name: 'application-by-idempotency',
      text: `
        SELECT *
        FROM job_applications
        WHERE applicant_user_id = $1
          AND idempotency_key = $2
        LIMIT 1
      `,
      values: [applicantUserId, idempotencyKey],
    });

    return result.rows[0] ?? null;
  },

  async ensureOpenJob(client: PgClient, jobId: string): Promise<boolean> {
    const result = await client.query<{ id: string }>({
      name: 'application-ensure-open-job',
      text: `
        SELECT id
        FROM jobs
        WHERE id = $1
          AND status = 'open'
          AND deleted_at IS NULL
          AND (valid_to IS NULL OR valid_to > now())
        LIMIT 1
      `,
      values: [jobId],
    });

    return result.rowCount === 1;
  },

  async createSubmitted(client: PgClient, input: SubmitApplicationInput): Promise<ApplicationRow> {
    const result = await client.query<ApplicationRow>({
      name: 'application-create-submitted',
      text: `
        INSERT INTO job_applications (
          job_id, applicant_user_id, cover_letter, resume_url,
          content, metadata, idempotency_key
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        RETURNING *
      `,
      values: [
        input.job_id,
        input.applicant_user_id,
        input.cover_letter ?? null,
        input.resume_url ?? null,
        input.content ?? null,
        JSON.stringify(input.metadata),
        input.idempotency_key,
      ],
    });

    return result.rows[0] as ApplicationRow;
  },

  async incrementJobApplicationCount(client: PgClient, jobId: string): Promise<void> {
    await client.query({
      name: 'application-increment-job-count',
      text: `
        UPDATE jobs
        SET application_count = application_count + 1
        WHERE id = $1
      `,
      values: [jobId],
    });
  },

  async listForJob(
    jobId: string,
    status: ApplicationStatus | null,
    cursor: KeysetCursor | null,
    limit: number,
  ): Promise<ApplicationRow[]> {
    const values: unknown[] = [jobId];
    const filters = ['job_id = $1'];

    if (status) {
      values.push(status);
      filters.push(`status = $${values.length}::application_status`);
    }

    if (cursor) {
      values.push(cursor.createdAt, cursor.id);
      filters.push(`(created_at, id) < ($${values.length - 1}::timestamptz, $${values.length}::bigint)`);
    }

    values.push(limit);

    const result = await pool.query<ApplicationRow>({
      name: 'applications-list-for-job',
      text: `
        SELECT *
        FROM job_applications
        WHERE ${filters.join(' AND ')}
        ORDER BY created_at DESC, id DESC
        LIMIT $${values.length}
      `,
      values,
    });

    return result.rows;
  },

  async listForUser(
    applicantUserId: string,
    cursor: KeysetCursor | null,
    limit: number,
  ): Promise<UserApplicationRow[]> {
    const values: unknown[] = [applicantUserId];
    let cursorFilter = '';

    if (cursor) {
      values.push(cursor.createdAt, cursor.id);
      cursorFilter = `AND (a.created_at, a.id) < ($2::timestamptz, $3::bigint)`;
    }

    values.push(limit);

    const result = await pool.query<UserApplicationRow>({
      name: 'applications-list-for-user',
      text: `
        SELECT a.id, a.job_id, a.status, a.created_at, a.updated_at,
               j.name AS job_name, j.slug AS job_slug
        FROM job_applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE a.applicant_user_id = $1
          ${cursorFilter}
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT $${values.length}
      `,
      values,
    });

    return result.rows;
  },

  async updateStatusCAS(
    client: PgClient,
    id: string,
    nextStatus: ApplicationStatus,
    expectedStatus: ApplicationStatus,
  ): Promise<ApplicationRow | null> {
    const result = await client.query<ApplicationRow>({
      name: 'application-update-status-cas',
      text: `
        UPDATE job_applications
        SET status = $2::application_status
        WHERE id = $1
          AND status = $3::application_status
        RETURNING *
      `,
      values: [id, nextStatus, expectedStatus],
    });

    return result.rows[0] ?? null;
  },

  async appendEvent(
    client: PgClient,
    eventType: 'application.submitted' | 'application.status_changed',
    payload: Record<string, unknown>,
  ): Promise<void> {
    await client.query({
      name: 'outbox-append-application-event',
      text: 'INSERT INTO event_outbox(event_type, payload) VALUES ($1, $2::jsonb)',
      values: [eventType, JSON.stringify(payload)],
    });
  },
};
