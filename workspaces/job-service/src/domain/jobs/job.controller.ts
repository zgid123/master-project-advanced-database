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

function getAuthenticatedUserId(request: FastifyRequest): string {
  const sub = request.user?.sub;
  const userId = String(sub ?? '');

  if (!/^\d+$/.test(userId)) {
    throw new HttpError(401, 'INVALID_USER_SUBJECT', 'JWT subject must be a numeric user id');
  }

  return userId;
}

export async function jobRoutes(app: FastifyInstance) {
  app.get('/v1/jobs', async (request) => {
    const query = listJobsQuerySchema.parse(request.query);
    const cursor = decodeCursor(query.cursor);

    if (query.q) {
      return JobService.search(
        query.q,
        query.location ?? null,
        query.job_type ?? null,
        query.limit,
      );
    }

    return JobService.listOpen(cursor, query.limit);
  });

  app.get('/v1/jobs/:id', async (request, reply) => {
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

  app.post('/v1/jobs', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createJobSchema.parse(request.body);
    const job = await JobService.create({
      ...body,
      posted_by_user_id: getAuthenticatedUserId(request),
    });

    return reply.code(201).send(job);
  });

  app.patch('/v1/jobs/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const body = updateJobSchema.parse(request.body);
    return JobService.update(id, body);
  });
}
