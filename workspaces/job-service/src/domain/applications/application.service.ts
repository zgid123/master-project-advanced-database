import { delKeys, getJson, setJson } from '../../cache/job-cache.js';
import { withTransaction } from '../../db/pool.js';
import { HttpError } from '../errors.js';
import type { KeysetCursor } from '../pagination.js';
import { encodeCursor } from '../pagination.js';
import { ApplicationRepo } from './application.repo.js';
import type {
  ApplicationRow,
  ApplicationStatus,
  SubmitApplicationInput,
  UpdateApplicationStatusInput,
  UserApplicationRow,
} from './application.types.js';

const allowedApplicationTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ['under_review', 'shortlisted', 'rejected', 'withdrawn'],
  under_review: ['shortlisted', 'interviewed', 'rejected', 'withdrawn'],
  shortlisted: ['interviewed', 'rejected', 'withdrawn'],
  interviewed: ['accepted', 'rejected', 'withdrawn'],
  accepted: ['withdrawn'],
  rejected: ['withdrawn'],
  withdrawn: [],
};

type PgError = Error & {
  code?: string;
  constraint?: string;
};

function isUniqueViolation(error: unknown, constraint: string): boolean {
  const pgError = error as PgError;
  return pgError.code === '23505' && pgError.constraint === constraint;
}

function assertApplicationStatusTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): void {
  if (from === to) return;
  if (!allowedApplicationTransitions[from].includes(to)) {
    throw new HttpError(
      409,
      'INVALID_APPLICATION_STATUS_TRANSITION',
      `Cannot change application status from ${from} to ${to}`,
    );
  }
}

function pageResponse<T extends { created_at: Date | string; id: string }>(rows: T[], limit: number) {
  return {
    items: rows,
    next_cursor: rows.length === limit ? encodeCursor(rows[rows.length - 1] as T) : null,
  };
}

export const ApplicationService = {
  async submit(input: SubmitApplicationInput): Promise<ApplicationRow> {
    const idempotencyCacheKey = `idem:${input.applicant_user_id}:${input.idempotency_key}`;
    const cached = await getJson<ApplicationRow>(idempotencyCacheKey);
    if (cached) return cached;

    const existing = await ApplicationRepo.findByIdempotency(
      input.applicant_user_id,
      input.idempotency_key,
    );

    if (existing) {
      await setJson(idempotencyCacheKey, existing, 86_400);
      return existing;
    }

    try {
      const application = await withTransaction(async (client) => {
        const jobIsOpen = await ApplicationRepo.ensureOpenJob(client, input.job_id);
        if (!jobIsOpen) {
          throw new HttpError(409, 'JOB_NOT_OPEN', 'Job is not open for applications');
        }

        const created = await ApplicationRepo.createSubmitted(client, input);
        const counterUpdated = await ApplicationRepo.incrementJobApplicationCount(client, input.job_id);
        if (!counterUpdated) {
          throw new HttpError(409, 'JOB_NOT_OPEN', 'Job is not open for applications');
        }

        await ApplicationRepo.appendEvent(client, 'application.submitted', {
          id: created.id,
          job_id: created.job_id,
          applicant_user_id: created.applicant_user_id,
          status: created.status,
        });
        return created;
      });

      await delKeys(`job:${input.job_id}`, `user:${input.applicant_user_id}:applied:${input.job_id}`);
      await setJson(idempotencyCacheKey, application, 86_400);
      return application;
    } catch (error) {
      if (isUniqueViolation(error, 'uq_job_applications_idempotency')) {
        const idempotent = await ApplicationRepo.findByIdempotency(
          input.applicant_user_id,
          input.idempotency_key,
        );
        if (idempotent) {
          await setJson(idempotencyCacheKey, idempotent, 86_400);
          return idempotent;
        }
      }

      if (isUniqueViolation(error, 'uq_job_applications_active')) {
        throw new HttpError(409, 'ALREADY_APPLIED', 'User already has an active application for this job');
      }

      throw error;
    }
  },

  async listForJob(
    jobId: string,
    status: ApplicationStatus | null,
    cursor: KeysetCursor | null,
    limit: number,
  ) {
    const rows = await ApplicationRepo.listForJob(jobId, status, cursor, limit);
    return pageResponse<ApplicationRow>(rows, limit);
  },

  async listForUser(applicantUserId: string, cursor: KeysetCursor | null, limit: number) {
    const rows = await ApplicationRepo.listForUser(applicantUserId, cursor, limit);
    return pageResponse<UserApplicationRow>(rows, limit);
  },

  async updateStatus(
    id: string,
    input: UpdateApplicationStatusInput,
    actorUserId: string,
  ): Promise<ApplicationRow> {
    assertApplicationStatusTransition(input.expected_status, input.status);

    const updated = await withTransaction(async (client) => {
      const target = await ApplicationRepo.findStatusMutationTarget(id, client);
      if (!target) {
        throw new HttpError(404, 'NOT_FOUND', 'Application was not found');
      }

      if (target.posted_by_user_id !== actorUserId) {
        throw new HttpError(403, 'FORBIDDEN', 'Only the job poster can update application status');
      }

      const row = await ApplicationRepo.updateStatusCAS(
        client,
        id,
        input.status,
        input.expected_status,
      );

      if (!row) {
        throw new HttpError(
          409,
          'APPLICATION_STATUS_CONFLICT',
          'Application was not found or status precondition failed',
        );
      }

      await ApplicationRepo.appendEvent(client, 'application.status_changed', {
        id: row.id,
        job_id: row.job_id,
        applicant_user_id: row.applicant_user_id,
        status: row.status,
      });

      return row;
    });

    await delKeys(`job:${updated.job_id}`, `user:${updated.applicant_user_id}:applied:${updated.job_id}`);
    return updated;
  },
};
