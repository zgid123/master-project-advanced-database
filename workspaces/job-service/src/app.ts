import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { jwtAlgorithms, resolveJwtSecret } from './auth/jwt-secret.js';
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
    secret: resolveJwtSecret,
    verify: {
      algorithms: jwtAlgorithms(),
    },
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Job Service API',
        description: 'Job and Job Application service API.',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://127.0.0.1:${config.port}`,
          description: 'Local development',
        },
      ],
      tags: [
        { name: 'Health', description: 'Service health checks' },
        { name: 'Jobs', description: 'Job listing, search, creation, update, and soft delete' },
        { name: 'Applications', description: 'Job application submission and status workflow' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      deepLinking: true,
      docExpansion: 'list',
    },
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

    const statusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({
        error: 'BAD_REQUEST',
        message: error instanceof Error ? error.message : 'Bad request',
      });
    }

    app.log.error({ error }, 'unhandled request error');
    return reply.code(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
    });
  });

  app.get('/', { schema: { hide: true } }, async (_request, reply) => {
    return reply.redirect('/docs');
  });

  app.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            service: { type: 'string' },
          },
          required: ['status', 'service'],
        },
      },
    },
  }, async () => ({
    status: 'ok',
    service: 'job-service',
  }));

  await app.register(jobRoutes);
  await app.register(applicationRoutes);

  return app;
}
