import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { jwtAlgorithms, resolveJwtSecret } from './auth/jwt-secret.js';
import { config } from './config.js';
import { deviceRoutes } from './domain/devices/device.controller.js';
import { HttpError } from './domain/errors.js';
import { notificationRoutes } from './domain/inbox/notification.controller.js';
import { preferenceRoutes } from './domain/preferences/preference.controller.js';
import { httpDuration, registry } from './observability/metrics.js';

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
        title: 'Notification Service API',
        description: 'Solvit notification inbox, preferences, devices, and internal ingestion API.',
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
        { name: 'Inbox', description: 'Notification inbox read workflows' },
        { name: 'Preferences', description: 'Per-user notification preferences' },
        { name: 'Devices', description: 'Push device token registration' },
        { name: 'Internal', description: 'Internal service-to-service ingestion endpoints' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          internalToken: {
            type: 'apiKey',
            in: 'header',
            name: 'x-internal-token',
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

  app.decorate('authenticateInternal', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers['x-internal-token'];
    if (token !== config.internalApiToken) {
      await reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'Internal API token is missing or invalid',
      });
    }
  });

  app.addHook('onResponse', async (request, reply) => {
    const route = request.routeOptions.url ?? request.url;
    httpDuration.observe({
      route,
      method: request.method,
      status: String(reply.statusCode),
    }, reply.elapsedTime / 1000);
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

    const fastifyError = error as {
      code?: unknown;
      statusCode?: unknown;
      validation?: unknown;
    };

    if (fastifyError.validation) {
      return reply.code(400).send({
        error: 'SCHEMA_VALIDATION',
        message: error instanceof Error ? error.message : 'Request did not match the route schema',
        issues: fastifyError.validation,
      });
    }

    if (
      fastifyError.code === 'FST_ERR_CTP_EMPTY_JSON_BODY'
      || fastifyError.code === 'FST_ERR_CTP_INVALID_JSON_BODY'
    ) {
      return reply.code(400).send({
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
    service: 'notification-service',
  }));

  app.get('/metrics', {
    schema: {
      tags: ['Health'],
      summary: 'Prometheus metrics',
    },
  }, async (_request, reply) => {
    reply.header('content-type', registry.contentType);
    return registry.metrics();
  });

  await app.register(notificationRoutes);
  await app.register(preferenceRoutes);
  await app.register(deviceRoutes);

  return app;
}
