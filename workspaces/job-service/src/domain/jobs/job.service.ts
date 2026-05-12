import { delKeys, getJson, setJson, singleFlight } from '../../cache/job-cache.js';
import { withMongoTransaction } from '../../db/mongo.js';
import { logger } from '../../observability/logger.js';
import { HttpError } from '../errors.js';
import type { KeysetCursor } from '../pagination.js';
import { encodeCursor } from '../pagination.js';
import { JobRepo } from './job.repo.js';
import {
  serializeJob,
  serializeJobListItem,
  serializeJobSearchItem,
  type CreateJobInput,
  type JobDoc,
  type JobListDoc,
  type JobResponse,
  type JobSearchDoc,
  type JobStatus,
  type UpdateJobInput,
} from './job.types.js';

const allowedJobTransitions: Record<JobStatus, JobStatus[]> = {
  draft: ['open', 'archived'],
  open: ['closed', 'archived'],
  closed: ['archived'],
  archived: [],
};

function assertStatusTransition(from: JobStatus, to: JobStatus): void {
  if (from === to) {
    throw new HttpError(400, 'NOOP_STATUS_TRANSITION', 'Job status is already set to that value');
  }

  if (!allowedJobTransitions[from].includes(to)) {
    throw new HttpError(409, 'INVALID_STATUS_TRANSITION', `Cannot change job status from ${from} to ${to}`);
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

export const JobService = {
  async getById(id: string): Promise<JobResponse | null> {
    const cacheKey = `job:${id}`;
    const cached = await getJson<JobResponse>(cacheKey);
    if (cached) return cached;

    try {
      return await singleFlight(`lock:${cacheKey}`, cacheKey, async () => {
        const doc = await JobRepo.findById(id);
        const response = doc ? serializeJob(doc) : null;
        if (response) await setJson(cacheKey, response, 60);
        return response;
      });
    } catch (error) {
      logger.warn({ error, id }, 'job cache single-flight failed; falling back to database');
      const doc = await JobRepo.findById(id);
      return doc ? serializeJob(doc) : null;
    }
  },

  async listOpen(cursor: KeysetCursor | null, limit: number) {
    const rows = await JobRepo.listOpenKeyset(cursor, limit + 1);
    return pageResponse<JobListDoc, ReturnType<typeof serializeJobListItem>>(
      rows,
      limit,
      serializeJobListItem,
    );
  },

  async search(q: string, location: string | null, type: string | null, limit: number) {
    const rows = await JobRepo.fullTextSearch(q, location, type, limit);
    return {
      items: rows.map((row: JobSearchDoc) => serializeJobSearchItem(row)),
      nextCursor: null,
    };
  },

  async create(input: CreateJobInput): Promise<JobResponse> {
    const doc = await withMongoTransaction(async (session) => {
      const row = await JobRepo.create(input, session);
      await JobRepo.appendEvent(session, 'job.created', {
        jobId: row._id.toHexString(),
        postedByUserId: row.postedByUserId.toHexString(),
        status: row.status,
      });
      return row;
    });

    return serializeJob(doc);
  },

  async update(id: string, patch: UpdateJobInput, actorUserId: string): Promise<JobResponse> {
    if (patch.status) {
      if (!patch.expectedStatus) {
        throw new HttpError(400, 'EXPECTED_STATUS_REQUIRED', 'expectedStatus is required for status updates');
      }
      assertStatusTransition(patch.expectedStatus, patch.status);
    }

    const updated = await withMongoTransaction(async (session) => {
      const target = await JobRepo.findMutationTarget(id, session);
      if (!target) {
        throw new HttpError(404, 'NOT_FOUND', 'Job was not found');
      }

      if (target.postedByUserId.toHexString() !== actorUserId) {
        throw new HttpError(403, 'FORBIDDEN', 'Only the job poster can update this job');
      }

      if (patch.expectedStatus && target.status !== patch.expectedStatus) {
        throw new HttpError(409, 'JOB_UPDATE_CONFLICT', 'Job status precondition failed');
      }

      const row = await JobRepo.updateCAS(id, patch, session);
      if (!row) {
        throw new HttpError(409, 'JOB_UPDATE_CONFLICT', 'Job was not found or status precondition failed');
      }

      if (patch.status) {
        await JobRepo.appendEvent(session, 'job.status_changed', {
          jobId: row._id.toHexString(),
          postedByUserId: row.postedByUserId.toHexString(),
          status: row.status,
        });
      }

      return row;
    });

    await delKeys(`job:${id}`, `job:v2:${id}`);
    return serializeJob(updated as JobDoc);
  },

  async softDelete(id: string, actorUserId: string): Promise<JobResponse> {
    const deleted = await withMongoTransaction(async (session) => {
      const target = await JobRepo.findMutationTarget(id, session);
      if (!target) {
        throw new HttpError(404, 'NOT_FOUND', 'Job was not found');
      }

      if (target.postedByUserId.toHexString() !== actorUserId) {
        throw new HttpError(403, 'FORBIDDEN', 'Only the job poster can delete this job');
      }

      const row = await JobRepo.softDelete(id, session);
      if (!row) {
        throw new HttpError(404, 'NOT_FOUND', 'Job was not found');
      }

      await JobRepo.appendEvent(session, 'job.deleted', {
        jobId: row._id.toHexString(),
        postedByUserId: row.postedByUserId.toHexString(),
        status: row.status,
      });

      return row;
    });

    await delKeys(`job:${id}`, `job:v2:${id}`);
    return serializeJob(deleted);
  },
};
