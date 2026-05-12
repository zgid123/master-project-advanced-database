import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { HttpError } from '../errors.js';
import { isObjectIdHex } from '../object-id.js';
import { decodeCursor } from '../pagination.js';
import { createJobSchema, jobStatuses, jobTypes, updateJobSchema } from './job.types.js';
import { JobService } from './job.service.js';

const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

const listJobsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  jobType: z.enum(jobTypes).optional(),
});

const bearerSecurity = [{ bearerAuth: [] }];

const idParamJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
  },
  required: ['id'],
} as const;

const jobBodyJsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 3, maxLength: 200 },
    content: { type: 'string', minLength: 1, maxLength: 20_000 },
    status: { type: 'string', enum: jobStatuses },
    jobType: { type: 'string', enum: jobTypes },
    location: { type: 'string', maxLength: 120 },
    tags: {
      type: 'array',
      maxItems: 16,
      items: { type: 'string', minLength: 1, maxLength: 32 },
    },
    metadata: { type: 'object', additionalProperties: true },
  },
  required: ['title', 'content'],
} as const;

function getAuthenticatedUserId(request: FastifyRequest): string {
  const userId = String(request.user?.sub ?? '');

  if (!isObjectIdHex(userId)) {
    throw new HttpError(401, 'INVALID_USER_SUBJECT', 'JWT subject must be an ObjectId hex string');
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
          q: { type: 'string', description: 'MongoDB text search query' },
          location: { type: 'string' },
          jobType: { type: 'string', enum: jobTypes },
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
        query.jobType ?? null,
        query.limit,
      );
    }

    return JobService.listOpen(decodeCursor(query.cursor), query.limit);
  });

  app.get('/v1/jobs/:id', {
    schema: {
      tags: ['Jobs'],
      summary: 'Get job by id',
      params: idParamJsonSchema,
    },
  }, async (request, reply) => {
    const { id } = objectIdParamSchema.parse(request.params);
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
      postedByUserId: getAuthenticatedUserId(request),
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
          expectedStatus: { type: 'string', enum: jobStatuses },
        },
      },
    },
  }, async (request) => {
    const { id } = objectIdParamSchema.parse(request.params);
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
    const { id } = objectIdParamSchema.parse(request.params);
    return JobService.softDelete(id, getAuthenticatedUserId(request));
  });
}
