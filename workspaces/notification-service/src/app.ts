import { timingSafeEqual } from 'node:crypto';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { jwtVerifyOptions, resolveJwtSecret } from './auth/jwt-secret.js';
import { config } from './config.js';
import { getRedis } from './cache/redis.js';
import { pool } from './db/pool.js';
import { deviceRoutes } from './domain/devices/device.controller.js';
import { HttpError } from './domain/errors.js';
import { notificationRoutes } from './domain/inbox/notification.controller.js';
import { preferenceRoutes } from './domain/preferences/preference.controller.js';
import { httpDuration, registry, startQueueDepthMetrics, stopQueueDepthMetrics } from './observability/metrics.js';

function timingSafeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function internalRateLimitKey(request: FastifyRequest): string {
  const serviceName = request.headers['x-service-name'];
  const service = Array.isArray(serviceName) ? serviceName[0] : serviceName;
  const identity = service || request.ip || 'unknown';
  return `rate:internal:${identity.replace(/[^a-zA-Z0-9_.:-]/g, '_').slice(0, 120)}`;
}

async function enforceInternalRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  if (config.internalRateLimitPerMinute === 0) return true;

  try {
    const redis = await getRedis();
    const key = internalRateLimitKey(request);
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);

    if (count > config.internalRateLimitPerMinute) {
      await reply.code(429).send({
        error: 'RATE_LIMITED',
        message: 'Internal notification ingest rate limit exceeded',
      });
      return false;
    }
  } catch (error) {
    request.log.warn({ error }, 'internal rate limit check failed');
  }

  return true;
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(jwt, {
    secret: resolveJwtSecret,
    verify: jwtVerifyOptions(),
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
    const tokenHeader = request.headers['x-internal-token'];
    const token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
    if (!token || !timingSafeStringEqual(token, config.internalApiToken)) {
      await reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'Internal API token is missing or invalid',
      });
      return;
    }

    request.log.info({
      service: request.headers['x-service-name'] ?? 'unknown',
      route: request.routeOptions.url,
    }, 'internal notification request authenticated');

    if (!await enforceInternalRateLimit(request, reply)) return;
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
            checks: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
          required: ['status', 'service'],
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            service: { type: 'string' },
            checks: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
          required: ['status', 'service'],
        },
      },
    },
  }, async (_request, reply) => {
    const [postgres, redis] = await Promise.allSettled([
      pool.query('SELECT 1'),
      getRedis().then((client) => client.ping()),
    ]);
    const ok = postgres.status === 'fulfilled' && redis.status === 'fulfilled';

    if (!ok) reply.code(503);

    return {
      status: ok ? 'ok' : 'degraded',
      service: 'notification-service',
      checks: {
        postgres: postgres.status === 'fulfilled' ? 'ok' : 'failed',
        redis: redis.status === 'fulfilled' ? 'ok' : 'failed',
      },
    };
  });

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

  if (config.nodeEnv !== 'test') {
    startQueueDepthMetrics();
    app.addHook('onClose', async () => {
      stopQueueDepthMetrics();
    });
  }

  return app;
}
