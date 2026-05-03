import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { HttpError } from '../errors.js';
import { registerDeviceSchema } from './device.types.js';
import { DeviceService } from './device.service.js';

const bearerSecurity = [{ bearerAuth: [] }];

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

function getAuthenticatedUserId(request: FastifyRequest): string {
  const sub = request.user?.sub;
  const userId = String(sub ?? '');

  if (!/^\d+$/.test(userId)) {
    throw new HttpError(401, 'INVALID_USER_SUBJECT', 'JWT subject must be a numeric user id');
  }

  return userId;
}

export async function deviceRoutes(app: FastifyInstance) {
  app.get('/v1/devices', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Devices'],
      summary: 'List active push devices for the authenticated user',
      security: bearerSecurity,
    },
  }, async (request) => DeviceService.list(getAuthenticatedUserId(request)));

  app.post('/v1/devices', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Devices'],
      summary: 'Register or refresh a push device token',
      security: bearerSecurity,
      body: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['ios', 'android', 'web'] },
          token: { type: 'string', minLength: 12, maxLength: 4096 },
          app_version: { type: ['string', 'null'], maxLength: 80 },
          device_info: { type: 'object', additionalProperties: true },
        },
        required: ['platform', 'token'],
      },
    },
  }, async (request, reply) => {
    const body = registerDeviceSchema.parse(request.body);
    const row = await DeviceService.register({
      ...body,
      user_id: getAuthenticatedUserId(request),
    });

    return reply.code(201).send(row);
  });

  app.delete('/v1/devices/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['Devices'],
      summary: 'Deactivate a push device token',
      security: bearerSecurity,
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', pattern: '^\\d+$' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const ok = await DeviceService.deactivate(getAuthenticatedUserId(request), id);
    if (!ok) {
      return reply.code(404).send({
        error: 'NOT_FOUND',
        message: 'Device token was not found',
      });
    }

    return { ok: true };
  });
}
