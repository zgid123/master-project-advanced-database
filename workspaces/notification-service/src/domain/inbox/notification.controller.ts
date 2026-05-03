import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { HttpError } from '../errors.js';
import { decodeCursor } from '../pagination.js';
import { createNotificationEventSchema, notificationListFilterSchema } from './notification.types.js';
import { NotificationService } from './notification.service.js';

const bearerSecurity = [{ bearerAuth: [] }];

const publicIdParamSchema = z.object({
  public_id: z.string().uuid(),
});

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  filter: notificationListFilterSchema,
});

function getAuthenticatedUserId(request: FastifyRequest): string {
  const sub = request.user?.sub;
  const userId = String(sub ?? '');

  if (!/^\d+$/.test(userId)) {
    throw new HttpError(401, 'INVALID_USER_SUBJECT', 'JWT subject must be a numeric user id');
  }

  return userId;
}

export async function notificationRoutes(app: FastifyInstance) {
  app.get('/v1/notifications', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Inbox'],
      summary: 'List notifications using keyset pagination',
      security: bearerSecurity,
      querystring: {
        type: 'object',
        properties: {
          cursor: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          filter: {
            type: 'string',
            description: 'all, unread, or category:<category_code>',
            default: 'all',
          },
        },
      },
    },
  }, async (request) => {
    const query = listQuerySchema.parse(request.query);
    return NotificationService.list(
      getAuthenticatedUserId(request),
      decodeCursor(query.cursor),
      query.limit,
      query.filter,
    );
  });

  app.get('/v1/notifications/unread-count', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Inbox'],
      summary: 'Get unread notification count',
      security: bearerSecurity,
    },
  }, async (request) => NotificationService.unreadCount(getAuthenticatedUserId(request)));

  app.patch('/v1/notifications/:public_id/read', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Inbox'],
      summary: 'Mark one notification as read',
      security: bearerSecurity,
      params: {
        type: 'object',
        properties: {
          public_id: { type: 'string', format: 'uuid' },
        },
        required: ['public_id'],
      },
    },
  }, async (request) => {
    const { public_id: publicId } = publicIdParamSchema.parse(request.params);
    return NotificationService.markRead(getAuthenticatedUserId(request), publicId);
  });

  app.post('/v1/notifications/mark-all-read', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Inbox'],
      summary: 'Mark all visible notifications as read',
      security: bearerSecurity,
    },
  }, async (request) => NotificationService.markAllRead(getAuthenticatedUserId(request)));

  app.patch('/v1/notifications/:public_id/archive', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Inbox'],
      summary: 'Archive one notification',
      security: bearerSecurity,
      params: {
        type: 'object',
        properties: {
          public_id: { type: 'string', format: 'uuid' },
        },
        required: ['public_id'],
      },
    },
  }, async (request) => {
    const { public_id: publicId } = publicIdParamSchema.parse(request.params);
    return NotificationService.archive(getAuthenticatedUserId(request), publicId);
  });

  app.post('/internal/notifications/events', {
    preHandler: [app.authenticateInternal],
    schema: {
      tags: ['Internal'],
      summary: 'Ingest a domain event and create recipient notifications',
      body: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
          source_service: { type: 'string' },
          source_type: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          source_id: { anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }] },
          actor_user_id: { anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }] },
          category_code: { type: 'string' },
          locale: { type: 'string', default: 'en' },
          recipients: {
            type: 'array',
            minItems: 1,
            maxItems: 10000,
            items: {
              type: 'object',
              properties: {
                user_id: { anyOf: [{ type: 'string' }, { type: 'number' }] },
              },
              required: ['user_id'],
            },
          },
          data: { type: 'object', additionalProperties: true },
          title: { type: 'string' },
          body: { type: 'string' },
          dedup_key_prefix: { type: 'string' },
        },
        required: ['event_id', 'source_service', 'category_code', 'recipients'],
      },
    },
  }, async (request, reply) => {
    const body = createNotificationEventSchema.parse(request.body);
    const result = await NotificationService.ingest(body);
    return reply.code(result.duplicate_event ? 200 : 202).send(result);
  });
}
