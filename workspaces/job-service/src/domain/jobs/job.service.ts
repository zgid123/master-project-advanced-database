import { delKeys, getJson, setJson, singleFlight } from '../../cache/job-cache.js';
import { withTransaction } from '../../db/pool.js';
import { HttpError } from '../errors.js';
import type { KeysetCursor } from '../pagination.js';
import { encodeCursor } from '../pagination.js';
import { isTerminalStatus, JobRepo } from './job.repo.js';
import type { CreateJobInput, JobListRow, JobRow, JobSearchRow, JobStatus, UpdateJobInput } from './job.types.js';

const allowedJobTransitions: Record<JobStatus, JobStatus[]> = {
  draft: ['open', 'archived'],
  open: ['closed', 'filled', 'expired', 'archived'],
  closed: ['archived'],
  filled: ['archived'],
  expired: ['archived'],
  archived: [],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
}

function normalizeSlug(input: Pick<CreateJobInput, 'name' | 'slug'>): string {
  const slug = input.slug ?? slugify(input.name);

  if (!/^[a-z0-9-]{3,160}$/.test(slug)) {
    throw new HttpError(
      400,
      'INVALID_SLUG',
      'Derived slug is invalid; provide an explicit slug with 3-160 lowercase letters, numbers, or hyphens',
    );
  }

  return slug;
}

function assertStatusTransition(from: JobStatus, to: JobStatus): void {
  if (from === to) return;
  if (!allowedJobTransitions[from].includes(to)) {
    throw new HttpError(409, 'INVALID_STATUS_TRANSITION', `Cannot change job status from ${from} to ${to}`);
  }
}

function pageResponse<T extends { created_at: Date | string; id: string }>(rows: T[], limit: number) {
  return {
    items: rows,
    next_cursor: rows.length === limit ? encodeCursor(rows[rows.length - 1] as T) : null,
  };
}

export const JobService = {
  async getById(id: string): Promise<JobRow | null> {
    const cacheKey = `job:${id}`;
    const cached = await getJson<JobRow>(cacheKey);
    if (cached) return cached;

    try {
      return await singleFlight(`lock:${cacheKey}`, cacheKey, async () => {
        const row = await JobRepo.findById(id);
        if (row) await setJson(cacheKey, row, 60);
        return row;
      });
    } catch {
      return JobRepo.findById(id);
    }
  },

  async listOpen(cursor: KeysetCursor | null, limit: number) {
    const rows = await JobRepo.listOpenKeyset(cursor, limit);
    return pageResponse<JobListRow>(rows, limit);
  },

  async search(q: string, location: string | null, type: string | null, limit: number) {
    const rows = await JobRepo.fullTextSearch(q, location, type, limit);
    return pageResponse<JobSearchRow>(rows, limit);
  },

  async create(input: CreateJobInput): Promise<JobRow> {
    const normalizedInput = {
      ...input,
      slug: normalizeSlug(input),
    };

    return withTransaction(async (client) => {
      const row = await JobRepo.create(normalizedInput, client);
      await JobRepo.appendEvent(client, 'job.created', {
        id: row.id,
        posted_by_user_id: row.posted_by_user_id,
        status: row.status,
      });
      return row;
    });
  },

  async update(id: string, patch: UpdateJobInput, actorUserId: string): Promise<JobRow> {
    if (patch.status) {
      if (!patch.expected_status) {
        throw new HttpError(400, 'EXPECTED_STATUS_REQUIRED', 'expected_status is required for status updates');
      }
      assertStatusTransition(patch.expected_status, patch.status);
    }

    const updated = await withTransaction(async (client) => {
      const target = await JobRepo.findMutationTarget(id, client);
      if (!target) {
        throw new HttpError(404, 'NOT_FOUND', 'Job was not found');
      }

      if (target.posted_by_user_id !== actorUserId) {
        throw new HttpError(403, 'FORBIDDEN', 'Only the job poster can update this job');
      }

      const row = await JobRepo.updateCAS(id, patch, client);
      if (!row) {
        throw new HttpError(409, 'JOB_UPDATE_CONFLICT', 'Job was not found or status precondition failed');
      }

      await JobRepo.appendEvent(client, patch.status && isTerminalStatus(patch.status) ? 'job.closed' : 'job.updated', {
        id: row.id,
        posted_by_user_id: row.posted_by_user_id,
        status: row.status,
      });

      return row;
    });

    await delKeys(`job:${id}`, `job:v2:${id}`);
    return updated;
  },
};
