import { createHmac } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/cache/rate-limit.js', () => ({
  rateLimitApply: vi.fn(),
}));

vi.mock('../../src/domain/applications/application.service.js', () => ({
  ApplicationService: {
    listForJob: vi.fn(),
    listForUser: vi.fn(),
    submit: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('../../src/domain/jobs/job.service.js', () => ({
  JobService: {
    create: vi.fn(),
    getById: vi.fn(),
    listOpen: vi.fn(),
    search: vi.fn(),
    softDelete: vi.fn(),
    update: vi.fn(),
  },
}));

import { rateLimitApply } from '../../src/cache/rate-limit.js';
import { buildApp } from '../../src/app.js';
import { ApplicationService } from '../../src/domain/applications/application.service.js';
import { JobService } from '../../src/domain/jobs/job.service.js';
import type { ApplicationRow } from '../../src/domain/applications/application.types.js';
import type { JobListRow, JobRow } from '../../src/domain/jobs/job.types.js';

const now = new Date('2026-05-02T08:00:00.000Z');

const jobRow: JobRow = {
  id: '101',
  public_uid: 'job_101',
  posted_by_user_id: '501',
  name: 'Backend Engineer',
  slug: 'backend-engineer',
  content: 'Build and operate the job service.',
  status: 'open',
  job_type: 'full_time',
  location: 'Remote',
  salary_min: '1000.00',
  salary_max: '2000.00',
  currency: 'USD',
  tags: ['typescript'],
  metadata: {},
  view_count: '0',
  application_count: 0,
  valid_to: null,
  deleted_at: null,
  created_at: now,
  updated_at: now,
};

const jobListRow: JobListRow = {
  id: jobRow.id,
  name: jobRow.name,
  slug: jobRow.slug,
  location: jobRow.location,
  salary_min: jobRow.salary_min,
  salary_max: jobRow.salary_max,
  currency: jobRow.currency,
  application_count: jobRow.application_count,
  created_at: jobRow.created_at,
};

const applicationRow: ApplicationRow = {
  id: '900',
  job_id: jobRow.id,
  applicant_user_id: '700',
  status: 'submitted',
  cover_letter: 'I can help build this service.',
  resume_url: null,
  content: null,
  metadata: {},
  idempotency_key: 'idem-123456',
  created_at: now,
  updated_at: now,
};

describe('job-service HTTP API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  function bearerToken(sub: string): string {
    const encodedHeader = base64urlJson({ alg: 'HS256', typ: 'JWT' });
    const encodedPayload = base64urlJson({ sub });
    const signature = createHmac('sha256', 'dev-secret')
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `Bearer ${encodedHeader}.${encodedPayload}.${signature}`;
  }

  it('redirects the root route to the Swagger UI portal', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/docs');
  });

  it('serves OpenAPI JSON for the API portal', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/docs/json',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      info: {
        title: 'Job Service API',
      },
      paths: expect.objectContaining({
        '/v1/jobs': expect.any(Object),
        '/v1/jobs/{id}/applications': expect.any(Object),
      }),
    });
  });

  it('returns list jobs payloads from GET /v1/jobs', async () => {
    vi.mocked(JobService.listOpen).mockResolvedValue({
      items: [jobListRow],
      next_cursor: null,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/jobs?limit=1',
    });

    expect(response.statusCode).toBe(200);
    expect(JobService.listOpen).toHaveBeenCalledWith(null, 1);
    expect(response.json()).toMatchObject({
      items: [
        {
          id: '101',
          name: 'Backend Engineer',
          slug: 'backend-engineer',
        },
      ],
      next_cursor: null,
    });
  });

  it('creates a job from POST /v1/jobs and injects the authenticated poster id', async () => {
    vi.mocked(JobService.create).mockResolvedValue(jobRow);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: {
        authorization: bearerToken('501'),
      },
      payload: {
        name: 'Backend Engineer',
        slug: 'backend-engineer',
        content: 'Build and operate the job service.',
        status: 'open',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(JobService.create).toHaveBeenCalledWith(expect.objectContaining({
      content: 'Build and operate the job service.',
      name: 'Backend Engineer',
      posted_by_user_id: '501',
      slug: 'backend-engineer',
      status: 'open',
    }));
    expect(response.json()).toMatchObject({
      id: '101',
      posted_by_user_id: '501',
      status: 'open',
    });
  });

  it('submits an application from POST /v1/jobs/:id/applications', async () => {
    vi.mocked(rateLimitApply).mockResolvedValue(undefined);
    vi.mocked(ApplicationService.submit).mockResolvedValue(applicationRow);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/jobs/101/applications',
      headers: {
        authorization: bearerToken('700'),
        'idempotency-key': 'idem-123456',
      },
      payload: {
        cover_letter: 'I can help build this service.',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(rateLimitApply).toHaveBeenCalledWith('700');
    expect(ApplicationService.submit).toHaveBeenCalledWith(expect.objectContaining({
      applicant_user_id: '700',
      cover_letter: 'I can help build this service.',
      idempotency_key: 'idem-123456',
      job_id: '101',
    }));
    expect(response.json()).toMatchObject({
      id: '900',
      job_id: '101',
      applicant_user_id: '700',
      status: 'submitted',
    });
  });
});

function base64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
