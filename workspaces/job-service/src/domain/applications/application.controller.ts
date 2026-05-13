import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { rateLimitApply } from '../../cache/rate-limit.js';
import { HttpError } from '../errors.js';
import { isObjectIdHex } from '../object-id.js';
import { decodeCursor } from '../pagination.js';
import {
  applicationStatuses,
  submitApplicationSchema,
  updateApplicationStatusSchema,
} from './application.types.js';
import { ApplicationService } from './application.service.js';

const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

const idempotencyKeySchema = z.string().min(8).max(80);

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
    id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
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
  const userId = String(request.user?.sub ?? '');

  if (!isObjectIdHex(userId)) {
    throw new HttpError(401, 'INVALID_USER_SUBJECT', 'JWT subject must be an ObjectId hex string');
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
    throw new HttpError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key must be 8-80 characters');
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
            maxLength: 80,
            description: 'Required idempotency key for safe retries',
          },
        },
        required: ['idempotency-key'],
      },
      body: {
        type: 'object',
        properties: {
          coverLetter: { type: 'string', maxLength: 5_000 },
          resumeUrl: { type: 'string', format: 'uri', maxLength: 500 },
          metadata: { type: 'object', additionalProperties: true },
        },
      },
    },
  }, async (request, reply) => {
    const { id: jobId } = objectIdParamSchema.parse(request.params);
    const applicantUserId = getAuthenticatedUserId(request);
    const body = submitApplicationSchema.parse(request.body);

    await rateLimitApply(applicantUserId);

    const application = await ApplicationService.submit({
      ...body,
      jobId,
      applicantUserId,
      idempotencyKey: getIdempotencyKey(request),
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
    const { id: jobId } = objectIdParamSchema.parse(request.params);
    const query = listApplicationsQuerySchema.parse(request.query);
    return ApplicationService.listForJob(
      jobId,
      query.status ?? null,
      decodeCursor(query.cursor),
      query.limit,
    );
  });

  app.get('/v1/jobs/:id/me/application', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Applications'],
      summary: 'Get the authenticated user application status for a job',
      security: bearerSecurity,
      params: idParamJsonSchema,
    },
  }, async (request) => {
    const { id: jobId } = objectIdParamSchema.parse(request.params);
    return ApplicationService.getForJobAndUser(jobId, getAuthenticatedUserId(request));
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
          expectedStatus: { type: 'string', enum: applicationStatuses },
        },
        required: ['status', 'expectedStatus'],
      },
    },
  }, async (request) => {
    const { id } = objectIdParamSchema.parse(request.params);
    const body = updateApplicationStatusSchema.parse(request.body);
    return ApplicationService.updateStatus(id, body, getAuthenticatedUserId(request));
  });
}
