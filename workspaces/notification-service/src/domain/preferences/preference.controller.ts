import type { FastifyInstance, FastifyRequest } from 'fastify';
import { HttpError } from '../errors.js';
import { preferencePutSchema } from './preference.types.js';
import { PreferenceService } from './preference.service.js';

const bearerSecurity = [{ bearerAuth: [] }];

function getAuthenticatedUserId(request: FastifyRequest): string {
  const sub = request.user?.sub;
  const userId = String(sub ?? '');

  if (!/^\d+$/.test(userId)) {
    throw new HttpError(401, 'INVALID_USER_SUBJECT', 'JWT subject must be a numeric user id');
  }

  return userId;
}

export async function preferenceRoutes(app: FastifyInstance) {
  app.get('/v1/preferences', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Preferences'],
      summary: 'List notification preferences for the authenticated user',
      security: bearerSecurity,
    },
  }, async (request) => PreferenceService.list(getAuthenticatedUserId(request)));

  app.put('/v1/preferences', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Preferences'],
      summary: 'Replace or upsert notification preferences for categories and channels',
      security: bearerSecurity,
      body: {
        type: 'object',
        properties: {
          preferences: {
            type: 'array',
            minItems: 1,
            maxItems: 200,
            items: {
              type: 'object',
              properties: {
                category_code: { type: 'string' },
                channel_code: { type: 'string', enum: ['in_app', 'email', 'web_push', 'mobile_push', 'sms'] },
                enabled: { type: 'boolean' },
                quiet_hours_start: { anyOf: [{ type: 'integer', minimum: 0, maximum: 23 }, { type: 'null' }] },
                quiet_hours_end: { anyOf: [{ type: 'integer', minimum: 0, maximum: 23 }, { type: 'null' }] },
                timezone: { type: 'string', default: 'UTC' },
              },
              required: ['category_code', 'channel_code', 'enabled'],
            },
          },
        },
        required: ['preferences'],
      },
    },
  }, async (request) => {
    const body = preferencePutSchema.parse(request.body);
    return PreferenceService.put(getAuthenticatedUserId(request), body.preferences);
  });
}
