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

const listApplicationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  status: z.enum(applicationStatuses).optional(),
});

const listMineQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

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

  return value;
}

export async function applicationRoutes(app: FastifyInstance) {
  app.post('/v1/jobs/:id/applications', { preHandler: [app.authenticate] }, async (request, reply) => {
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

  app.get('/v1/jobs/:id/applications', { preHandler: [app.authenticate] }, async (request) => {
    const { id: jobId } = idParamSchema.parse(request.params);
    const query = listApplicationsQuerySchema.parse(request.query);
    return ApplicationService.listForJob(
      jobId,
      query.status ?? null,
      decodeCursor(query.cursor),
      query.limit,
    );
  });

  app.get('/v1/me/applications', { preHandler: [app.authenticate] }, async (request) => {
    const query = listMineQuerySchema.parse(request.query);
    return ApplicationService.listForUser(
      getAuthenticatedUserId(request),
      decodeCursor(query.cursor),
      query.limit,
    );
  });

  app.patch('/v1/applications/:id/status', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = applicationIdParamSchema.parse(request.params);
    const body = updateApplicationStatusSchema.parse(request.body);
    return ApplicationService.updateStatus(id, body, getAuthenticatedUserId(request));
  });
}
