import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { closeRedis, getRedis } from './cache/redis.js';
import { config } from './config.js';
import { HttpError } from './errors.js';
import { closeNeo4jDriver, verifyNeo4jConnectivity } from './neo4j/driver.js';
import { metricsRegistry } from './observability/metrics.js';
import { internalRoutes } from './routes/internal.routes.js';
import { recommendationRoutes } from './routes/recommendation.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'RecSys Service API',
        description:
          'Database-first recommendation service backed by Neo4j and Redis Streams.',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://127.0.0.1:${config.port}`,
          description: 'Local development',
        },
      ],
      tags: [
        { name: 'Health', description: 'Readiness and metrics' },
        {
          name: 'Recommendations',
          description: 'Personalized and related topic recommendations',
        },
        {
          name: 'Internal Events',
          description: 'Event push endpoints for source services',
        },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      deepLinking: true,
      docExpansion: 'list',
    },
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
      validation?: unknown;
    };

    if (fastifyError.validation) {
      return reply.code(400).send({
        error: 'SCHEMA_VALIDATION',
        message:
          error instanceof Error
            ? error.message
            : 'Request did not match the route schema',
        issues: fastifyError.validation,
      });
    }

    if (
      fastifyError.code === 'FST_ERR_CTP_EMPTY_JSON_BODY' ||
      fastifyError.code === 'FST_ERR_CTP_INVALID_JSON_BODY'
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

  app.addHook('onClose', async () => {
    await Promise.all([closeRedis(), closeNeo4jDriver()]);
  });

  app.get('/', { schema: { hide: true } }, async (_request, reply) => {
    return reply.redirect('/docs');
  });

  app.get(
    '/metrics',
    {
      schema: {
        tags: ['Health'],
        summary: 'Prometheus metrics',
      },
    },
    async (_request, reply) => {
      reply.header('content-type', metricsRegistry.contentType);
      return metricsRegistry.metrics();
    },
  );

  app.get('/health', { schema: { hide: true } }, healthHandler);
  app.get(
    '/v1/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Readiness check',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              service: { type: 'string' },
              dependencies: {
                type: 'object',
                additionalProperties: { type: 'string' },
              },
            },
            required: ['status', 'service', 'dependencies'],
          },
        },
      },
    },
    healthHandler,
  );

  await app.register(recommendationRoutes);
  await app.register(internalRoutes);

  return app;
}

async function healthHandler(_request: FastifyRequest, reply: FastifyReply) {
  try {
    await Promise.all([
      verifyNeo4jConnectivity(),
      getRedis().then((redis) => redis.ping()),
    ]);

    return {
      status: 'ok',
      service: 'recsys',
      dependencies: {
        neo4j: 'ok',
        redis: 'ok',
      },
    };
  } catch {
    return reply.code(503).send({
      status: 'error',
      service: 'recsys',
      dependencies: {
        neo4j: 'unknown',
        redis: 'unknown',
      },
    });
  }
}
