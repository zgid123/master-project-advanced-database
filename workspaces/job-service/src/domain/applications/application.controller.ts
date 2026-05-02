import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { rateLimitApply } from '../../cache/rate-limit.js';
import { HttpError } from '../errors.js';
import { decodeCursor } from '../pagination.js';
import {
  applicationStatuses,
  submitApplicationSchema,
  updateApplicationStatusSchema,
} from './application.types.js';
import { ApplicationService } from './application.service.js';

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const applicationIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const idempotencyKeySchema = z.string().min(8).max(255);

const listApplicationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  status: z.enum(applicationStatuses).optional(),
});

const listMineQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const bearerSecurity = [{ bearerAuth: [] }];

const idParamJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', pattern: '^\\d+$' },
  },
  required: ['id'],
} as const;

const cursorQueryJsonSchema = {
  type: 'object',
  properties: {
    cursor: { type: 'string' },
    limit: { type: 'integer', minimum: 1, maximum: 100 },
  },
} as const;

function getAuthenticatedUserId(request: FastifyRequest): string {
  const sub = request.user?.sub;
  const userId = String(sub ?? '');

  if (!/^\d+$/.test(userId)) {
    throw new HttpError(401, 'INVALID_USER_SUBJECT', 'JWT subject must be a numeric user id');
  }

  return userId;
}

function getIdempotencyKey(request: FastifyRequest): string {
  const raw = request.headers['idempotency-key'];
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (!value) {
    throw new HttpError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required');
  }

  const parsed = idempotencyKeySchema.safeParse(value);
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key must be 8-255 characters');
  }

  return parsed.data;
}

export async function applicationRoutes(app: FastifyInstance) {
  app.post('/v1/jobs/:id/applications', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Applications'],
      summary: 'Submit an application for a job',
      security: bearerSecurity,
      params: idParamJsonSchema,
      headers: {
        type: 'object',
        properties: {
          'idempotency-key': {
            type: 'string',
            minLength: 8,
            maxLength: 255,
            description: 'Required idempotency key for safe retries',
          },
        },
        required: ['idempotency-key'],
      },
      body: {
        type: 'object',
        properties: {
          cover_letter: { type: 'string', maxLength: 10000 },
          resume_url: { type: 'string', format: 'uri' },
          content: { type: 'string', maxLength: 10000 },
          metadata: { type: 'object', additionalProperties: true },
        },
      },
    },
  }, async (request, reply) => {
    const { id: jobId } = idParamSchema.parse(request.params);
    const applicantUserId = getAuthenticatedUserId(request);
    const body = submitApplicationSchema.parse(request.body);

    await rateLimitApply(applicantUserId);

    const application = await ApplicationService.submit({
      ...body,
      job_id: jobId,
      applicant_user_id: applicantUserId,
      idempotency_key: getIdempotencyKey(request),
    });

    return reply.code(201).send(application);
  });

  app.get('/v1/jobs/:id/applications', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Applications'],
      summary: 'List applications for a job',
      security: bearerSecurity,
      params: idParamJsonSchema,
      querystring: {
        type: 'object',
        properties: {
          cursor: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
          status: { type: 'string', enum: applicationStatuses },
        },
      },
    },
  }, async (request) => {
    const { id: jobId } = idParamSchema.parse(request.params);
    const query = listApplicationsQuerySchema.parse(request.query);
    return ApplicationService.listForJob(
      jobId,
      query.status ?? null,
      decodeCursor(query.cursor),
      query.limit,
    );
  });

  app.get('/v1/me/applications', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Applications'],
      summary: 'List applications submitted by the authenticated user',
      security: bearerSecurity,
      querystring: cursorQueryJsonSchema,
    },
  }, async (request) => {
    const query = listMineQuerySchema.parse(request.query);
    return ApplicationService.listForUser(
      getAuthenticatedUserId(request),
      decodeCursor(query.cursor),
      query.limit,
    );
  });

  app.patch('/v1/applications/:id/status', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Applications'],
      summary: 'Update application status as the job poster',
      security: bearerSecurity,
      params: idParamJsonSchema,
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: applicationStatuses },
          expected_status: { type: 'string', enum: applicationStatuses },
        },
        required: ['status', 'expected_status'],
      },
    },
  }, async (request) => {
    const { id } = applicationIdParamSchema.parse(request.params);
    const body = updateApplicationStatusSchema.parse(request.body);
    return ApplicationService.updateStatus(id, body, getAuthenticatedUserId(request));
  });
}
