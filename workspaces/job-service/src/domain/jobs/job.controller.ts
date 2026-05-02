import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { HttpError } from '../errors.js';
import { decodeCursor } from '../pagination.js';
import { createJobSchema, jobTypes, updateJobSchema } from './job.types.js';
import { JobService } from './job.service.js';

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const listJobsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  job_type: z.enum(jobTypes).optional(),
});

const bearerSecurity = [{ bearerAuth: [] }];

const idParamJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', pattern: '^\\d+$' },
  },
  required: ['id'],
} as const;

const jobBodyJsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 240 },
    slug: { type: 'string', pattern: '^[a-z0-9-]{3,160}$' },
    content: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['draft', 'open', 'closed', 'filled', 'expired', 'archived'] },
    job_type: { type: 'string', enum: jobTypes },
    location: { type: 'string', maxLength: 240 },
    salary_min: { type: 'number', minimum: 0 },
    salary_max: { type: 'number', minimum: 0 },
    currency: { type: 'string', minLength: 3, maxLength: 3 },
    tags: { type: 'array', items: { type: 'string' } },
    metadata: { type: 'object', additionalProperties: true },
    valid_to: { type: 'string', format: 'date-time' },
  },
  required: ['name', 'content'],
} as const;

function getAuthenticatedUserId(request: FastifyRequest): string {
  const sub = request.user?.sub;
  const userId = String(sub ?? '');

  if (!/^\d+$/.test(userId)) {
    throw new HttpError(401, 'INVALID_USER_SUBJECT', 'JWT subject must be a numeric user id');
  }

  return userId;
}

export async function jobRoutes(app: FastifyInstance) {
  app.get('/v1/jobs', {
    schema: {
      tags: ['Jobs'],
      summary: 'List open jobs or search jobs',
      querystring: {
        type: 'object',
        properties: {
          cursor: { type: 'string', description: 'Base64url keyset cursor for list mode only' },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
          q: { type: 'string', description: 'Full-text search query' },
          location: { type: 'string' },
          job_type: { type: 'string', enum: jobTypes },
        },
      },
    },
  }, async (request) => {
    const query = listJobsQuerySchema.parse(request.query);

    if (query.q) {
      if (query.cursor) {
        throw new HttpError(400, 'SEARCH_CURSOR_UNSUPPORTED', 'Search results do not support cursor pagination yet');
      }

      return JobService.search(
        query.q,
        query.location ?? null,
        query.job_type ?? null,
        query.limit,
      );
    }

    const cursor = decodeCursor(query.cursor);
    return JobService.listOpen(cursor, query.limit);
  });

  app.get('/v1/jobs/:id', {
    schema: {
      tags: ['Jobs'],
      summary: 'Get job by id',
      params: idParamJsonSchema,
    },
  }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const job = await JobService.getById(id);

    if (!job) {
      return reply.code(404).send({
        error: 'NOT_FOUND',
        message: 'Job was not found',
      });
    }

    return job;
  });

  app.post('/v1/jobs', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Jobs'],
      summary: 'Create a job',
      security: bearerSecurity,
      body: jobBodyJsonSchema,
    },
  }, async (request, reply) => {
    const body = createJobSchema.parse(request.body);
    const job = await JobService.create({
      ...body,
      posted_by_user_id: getAuthenticatedUserId(request),
    });

    return reply.code(201).send(job);
  });

  app.patch('/v1/jobs/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Jobs'],
      summary: 'Update a job with optional status CAS precondition',
      security: bearerSecurity,
      params: idParamJsonSchema,
      body: {
        ...jobBodyJsonSchema,
        required: [],
        properties: {
          ...jobBodyJsonSchema.properties,
          expected_status: { type: 'string', enum: ['draft', 'open', 'closed', 'filled', 'expired', 'archived'] },
        },
      },
    },
  }, async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const body = updateJobSchema.parse(request.body);
    return JobService.update(id, body, getAuthenticatedUserId(request));
  });

  app.delete('/v1/jobs/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Jobs'],
      summary: 'Soft delete a job',
      security: bearerSecurity,
      params: idParamJsonSchema,
    },
  }, async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return JobService.softDelete(id, getAuthenticatedUserId(request));
  });
}
