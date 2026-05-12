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
import { HttpError } from '../../src/domain/errors.js';
import type { ApplicationResponse } from '../../src/domain/applications/application.types.js';
import type { JobListResponse, JobResponse } from '../../src/domain/jobs/job.types.js';

const now = '2026-05-02T08:00:00.000Z';
const jobId = '664c4e9a5a3b2c7d1e0a1f88';
const posterId = '664c4e9a5a3b2c7d1e0a1f10';
const applicantId = '664c4e9a5a3b2c7d1e0a1f20';
const applicationId = '664c4e9a5a3b2c7d1e0a1f99';

const jobResponse: JobResponse = {
  id: jobId,
  postedByUserId: posterId,
  title: 'Backend Engineer',
  content: 'Build and operate the job service.',
  status: 'open',
  jobType: 'full_time',
  location: 'Remote',
  tags: ['typescript'],
  metadata: {},
  applicationCount: 0,
  createdAt: now,
  updatedAt: now,
};

const jobListResponse: JobListResponse = {
  id: jobResponse.id,
  title: jobResponse.title,
  location: jobResponse.location,
  jobType: jobResponse.jobType,
  status: jobResponse.status,
  applicationCount: jobResponse.applicationCount,
  createdAt: jobResponse.createdAt,
};

const applicationResponse: ApplicationResponse = {
  id: applicationId,
  jobId,
  applicantUserId: applicantId,
  status: 'submitted',
  coverLetter: 'I can help build this service.',
  resumeUrl: null,
  idempotencyKey: 'idem-123456',
  denormalized: {
    jobTitle: 'Backend Engineer',
    jobPostedByUserId: posterId,
  },
  metadata: {},
  createdAt: now,
  updatedAt: now,
};

describe('job-service HTTP API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterEach(() => {
    vi.resetAllMocks();
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
      items: [jobListResponse],
      nextCursor: null,
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
          id: jobId,
          title: 'Backend Engineer',
        },
      ],
      nextCursor: null,
    });
  });

  it('creates a job from POST /v1/jobs and injects the authenticated poster id', async () => {
    vi.mocked(JobService.create).mockResolvedValue(jobResponse);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: {
        authorization: bearerToken(posterId),
      },
      payload: {
        title: 'Backend Engineer',
        content: 'Build and operate the job service.',
        status: 'open',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(JobService.create).toHaveBeenCalledWith(expect.objectContaining({
      content: 'Build and operate the job service.',
      title: 'Backend Engineer',
      postedByUserId: posterId,
      status: 'open',
    }));
    expect(response.json()).toMatchObject({
      id: jobId,
      postedByUserId: posterId,
      status: 'open',
    });
  });

  it('rejects protected routes when the JWT is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      payload: {
        title: 'Backend Engineer',
        content: 'Build and operate the job service.',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: 'UNAUTHORIZED',
    });
    expect(JobService.create).not.toHaveBeenCalled();
  });

  it('returns schema validation details for JSON Schema failures', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: {
        authorization: bearerToken(posterId),
      },
      payload: {
        title: 'No',
        content: 'Too short title.',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: 'SCHEMA_VALIDATION',
      issues: expect.any(Array),
    });
    expect(JobService.create).not.toHaveBeenCalled();
  });

  it('returns bad request for malformed JSON bodies', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: {
        authorization: bearerToken(posterId),
        'content-type': 'application/json',
      },
      payload: '{"title":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: 'BAD_REQUEST',
    });
    expect(JobService.create).not.toHaveBeenCalled();
  });

  it('rejects search cursors because search pagination is not implemented yet', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/jobs?q=backend&cursor=ignored',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: 'SEARCH_CURSOR_UNSUPPORTED',
    });
    expect(JobService.search).not.toHaveBeenCalled();
  });

  it('maps service authorization failures to the route response', async () => {
    vi.mocked(JobService.update).mockRejectedValue(
      new HttpError(403, 'FORBIDDEN', 'Only the job poster can update this job'),
    );

    const response = await app.inject({
      method: 'PATCH',
      url: `/v1/jobs/${jobId}`,
      headers: {
        authorization: bearerToken('664c4e9a5a3b2c7d1e0a1f11'),
      },
      payload: {
        title: 'Backend Platform Engineer',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: 'FORBIDDEN',
    });
  });

  it('submits an application from POST /v1/jobs/:id/applications', async () => {
    vi.mocked(rateLimitApply).mockResolvedValue(undefined);
    vi.mocked(ApplicationService.submit).mockResolvedValue(applicationResponse);

    const response = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${jobId}/applications`,
      headers: {
        authorization: bearerToken(applicantId),
        'idempotency-key': 'idem-123456',
      },
      payload: {
        coverLetter: 'I can help build this service.',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(rateLimitApply).toHaveBeenCalledWith(applicantId);
    expect(ApplicationService.submit).toHaveBeenCalledWith(expect.objectContaining({
      applicantUserId: applicantId,
      coverLetter: 'I can help build this service.',
      idempotencyKey: 'idem-123456',
      jobId,
    }));
    expect(response.json()).toMatchObject({
      id: applicationId,
      jobId,
      applicantUserId: applicantId,
      status: 'submitted',
    });
  });

  it('rejects invalid Idempotency-Key headers before submit handling', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${jobId}/applications`,
      headers: {
        authorization: bearerToken(applicantId),
        'idempotency-key': 'short',
      },
      payload: {
        coverLetter: 'I can help build this service.',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: 'SCHEMA_VALIDATION',
      issues: expect.any(Array),
    });
    expect(ApplicationService.submit).not.toHaveBeenCalled();
  });

  it('maps not-open application submissions to 409 responses', async () => {
    vi.mocked(rateLimitApply).mockResolvedValue(undefined);
    vi.mocked(ApplicationService.submit).mockRejectedValue(
      new HttpError(409, 'JOB_NOT_OPEN', 'Job is not open for applications'),
    );

    const response = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${jobId}/applications`,
      headers: {
        authorization: bearerToken(applicantId),
        'idempotency-key': 'idem-123456',
      },
      payload: {
        coverLetter: 'I can help build this service.',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      error: 'JOB_NOT_OPEN',
    });
  });
});

function base64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
