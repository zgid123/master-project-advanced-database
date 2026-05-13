import { MongoServerError } from 'mongodb';
import { delKeys, getJson, setJson } from '../../cache/job-cache.js';
import { withMongoTransaction } from '../../db/mongo.js';
import { HttpError } from '../errors.js';
import type { KeysetCursor } from '../pagination.js';
import { encodeCursor } from '../pagination.js';
import { ApplicationRepo } from './application.repo.js';
import {
  serializeApplication,
  serializeUserApplication,
  type ApplicationDoc,
  type ApplicationResponse,
  type ApplicationStatus,
  type SubmitApplicationInput,
  type UpdateApplicationStatusInput,
  type UserApplicationResponse,
  type UserJobApplicationResponse,
} from './application.types.js';

const allowedApplicationTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ['reviewing', 'accepted', 'rejected', 'withdrawn'],
  reviewing: ['accepted', 'rejected', 'withdrawn'],
  accepted: ['withdrawn'],
  rejected: ['withdrawn'],
  withdrawn: [],
};

function isDuplicateKey(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === 11000;
}

function assertApplicationStatusTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): void {
  if (from === to) {
    throw new HttpError(400, 'NOOP_STATUS_TRANSITION', 'Application status is already set to that value');
  }

  if (!allowedApplicationTransitions[from].includes(to)) {
    throw new HttpError(
      409,
      'INVALID_APPLICATION_STATUS_TRANSITION',
      `Cannot change application status from ${from} to ${to}`,
    );
  }
}

function pageResponse<T extends { createdAt: Date; _id: { toHexString(): string } }, R>(
  rows: T[],
  limit: number,
  serialize: (row: T) => R,
) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: items.map(serialize),
    nextCursor: hasMore ? encodeCursor(items[items.length - 1] as T) : null,
  };
}

export const ApplicationService = {
  async submit(input: SubmitApplicationInput): Promise<ApplicationResponse> {
    const idempotencyCacheKey = `idem:${input.applicantUserId}:${input.idempotencyKey}`;
    const cached = await getJson<ApplicationResponse>(idempotencyCacheKey);
    if (cached) return cached;

    const existing = await ApplicationRepo.findByIdempotency(
      input.applicantUserId,
      input.idempotencyKey,
    );

    if (existing) {
      const response = serializeApplication(existing);
      await setJson(idempotencyCacheKey, response, 86_400);
      return response;
    }

    try {
      const application = await withMongoTransaction(async (session) => {
        const job = await ApplicationRepo.findOpenJob(session, input.jobId);
        if (!job) {
          throw new HttpError(409, 'JOB_NOT_OPEN', 'Job is not open for applications');
        }

        const created = await ApplicationRepo.createSubmitted(session, input, job);
        const counterUpdated = await ApplicationRepo.incrementJobApplicationCount(session, input.jobId);
        if (!counterUpdated) {
          throw new HttpError(409, 'JOB_NOT_OPEN', 'Job is not open for applications');
        }

        await ApplicationRepo.appendEvent(session, 'job.application.submitted', {
          jobId: created.jobId.toHexString(),
          applicationId: created._id.toHexString(),
          applicantUserId: created.applicantUserId.toHexString(),
        });
        return created;
      });

      const response = serializeApplication(application);
      await delKeys(`job:${input.jobId}`, `user:${input.applicantUserId}:applied:${input.jobId}`);
      await setJson(idempotencyCacheKey, response, 86_400);
      return response;
    } catch (error) {
      if (isDuplicateKey(error)) {
        const idempotent = await ApplicationRepo.findByIdempotency(
          input.applicantUserId,
          input.idempotencyKey,
        );
        if (idempotent) {
          const response = serializeApplication(idempotent);
          await setJson(idempotencyCacheKey, response, 86_400);
          return response;
        }
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
    const rows = await ApplicationRepo.listForJob(jobId, status, cursor, limit + 1);
    return pageResponse<ApplicationDoc, ApplicationResponse>(rows, limit, serializeApplication);
  },

  async listForUser(applicantUserId: string, cursor: KeysetCursor | null, limit: number) {
    const rows = await ApplicationRepo.listForUser(applicantUserId, cursor, limit + 1);
    return pageResponse<ApplicationDoc, UserApplicationResponse>(rows, limit, serializeUserApplication);
  },

  async getForJobAndUser(jobId: string, applicantUserId: string): Promise<UserJobApplicationResponse> {
    const cacheKey = `user:${applicantUserId}:applied:${jobId}`;
    const cached = await getJson<UserJobApplicationResponse>(cacheKey);
    if (cached) return cached;

    const status = await ApplicationRepo.findUserJobStatus(applicantUserId, jobId);
    const response = {
      jobId,
      applied: status !== null,
      status,
    };
    await setJson(cacheKey, response, 300);
    return response;
  },

  async updateStatus(
    id: string,
    input: UpdateApplicationStatusInput,
    actorUserId: string,
  ): Promise<ApplicationResponse> {
    assertApplicationStatusTransition(input.expectedStatus, input.status);

    const updated = await withMongoTransaction(async (session) => {
      const target = await ApplicationRepo.findStatusMutationTarget(id, session);
      if (!target) {
        throw new HttpError(404, 'NOT_FOUND', 'Application was not found');
      }

      const jobPosterId = target.denormalized?.jobPostedByUserId
        ?? await ApplicationRepo.findJobPosterId(session, target.jobId);

      if (!jobPosterId || jobPosterId.toHexString() !== actorUserId) {
        throw new HttpError(403, 'FORBIDDEN', 'Only the job poster can update application status');
      }

      const row = await ApplicationRepo.updateStatusCAS(
        session,
        id,
        input.status,
        input.expectedStatus,
      );

      if (!row) {
        throw new HttpError(
          409,
          'APPLICATION_STATUS_CONFLICT',
          'Application was not found or status precondition failed',
        );
      }

      await ApplicationRepo.appendEvent(
        session,
        input.status === 'withdrawn' ? 'job.application.withdrawn' : 'job.application.status_changed',
        {
          jobId: row.jobId.toHexString(),
          applicationId: row._id.toHexString(),
          applicantUserId: row.applicantUserId.toHexString(),
          status: row.status,
        },
      );

      return row;
    });

    await delKeys(`job:${updated.jobId.toHexString()}`, `user:${updated.applicantUserId.toHexString()}:applied:${updated.jobId.toHexString()}`);
    return serializeApplication(updated);
  },
};
