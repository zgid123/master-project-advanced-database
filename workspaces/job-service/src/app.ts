import jwt from '@fastify/jwt';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { config } from './config.js';
import { HttpError } from './domain/errors.js';
import { applicationRoutes } from './domain/applications/application.controller.js';
import { jobRoutes } from './domain/jobs/job.controller.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(jwt, {
    secret: config.jwtSecret,
  });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      await reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'JWT is missing or invalid',
      });
    }
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: error.issues,
      });
    }

    app.log.error({ error }, 'unhandled request error');
    return reply.code(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
    });
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'job-service',
  }));

  await app.register(jobRoutes);
  await app.register(applicationRoutes);

  return app;
}
