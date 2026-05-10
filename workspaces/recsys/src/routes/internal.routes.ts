import type { FastifyInstance, FastifyRequest } from 'fastify';

import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { appendEventsToStream } from '../events/stream.js';
import {
  commentEventSchema,
  type EventKind,
  normalizeBodyToEvents,
  type RecSysEvent,
  subscriptionEventSchema,
  substackEventSchema,
  topicEventSchema,
  voteEventSchema,
} from '../events/types.js';

export async function internalRoutes(app: FastifyInstance) {
  app.post(
    '/v1/internal/events/vote',
    {
      schema: eventRouteSchema('Push vote events into the RecSys event stream'),
    },
    async (request, reply) => {
      assertInternal(request);
      const events = normalizeBodyToEvents(voteEventSchema, request.body);
      const accepted = await appendEventsToStream('vote', events);
      return reply.code(202).send({ accepted });
    },
  );

  app.post(
    '/v1/internal/events/subscription',
    {
      schema: eventRouteSchema(
        'Push subscription events into the RecSys event stream',
      ),
    },
    async (request, reply) => {
      assertInternal(request);
      const events = normalizeBodyToEvents(
        subscriptionEventSchema,
        request.body,
      );
      const accepted = await appendEventsToStream('subscription', events);
      return reply.code(202).send({ accepted });
    },
  );

  app.post(
    '/v1/internal/events/topic',
    {
      schema: eventRouteSchema(
        'Push topic upsert events into the RecSys event stream',
      ),
    },
    async (request, reply) => {
      assertInternal(request);
      const events = normalizeBodyToEvents(topicEventSchema, request.body);
      const accepted = await appendEvents('topic', events);
      return reply.code(202).send({ accepted });
    },
  );

  app.post(
    '/v1/internal/events/comment',
    {
      schema: eventRouteSchema(
        'Push comment upsert events into the RecSys event stream',
      ),
    },
    async (request, reply) => {
      assertInternal(request);
      const events = normalizeBodyToEvents(commentEventSchema, request.body);
      const accepted = await appendEvents('comment', events);
      return reply.code(202).send({ accepted });
    },
  );

  app.post(
    '/v1/internal/events/substack',
    {
      schema: eventRouteSchema(
        'Push substack upsert events into the RecSys event stream',
      ),
    },
    async (request, reply) => {
      assertInternal(request);
      const events = normalizeBodyToEvents(substackEventSchema, request.body);
      const accepted = await appendEvents('substack', events);
      return reply.code(202).send({ accepted });
    },
  );
}

function assertInternal(request: FastifyRequest): void {
  const value = request.headers['x-internal-service-secret'];
  const secret = Array.isArray(value) ? value[0] : value;

  if (secret !== config.internalServiceSecret) {
    throw new HttpError(
      401,
      'UNAUTHORIZED_INTERNAL_SERVICE',
      'Internal service secret is missing or invalid',
    );
  }
}

function appendEvents(kind: EventKind, events: RecSysEvent[]): Promise<number> {
  return appendEventsToStream(kind, events);
}

function eventRouteSchema(summary: string) {
  return {
    tags: ['Internal Events'],
    summary,
    headers: {
      type: 'object',
      properties: {
        'x-internal-service-secret': { type: 'string' },
      },
      required: ['x-internal-service-secret'],
    },
    body: {
      oneOf: [
        { type: 'object', additionalProperties: true },
        {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
        },
      ],
    },
    response: {
      202: {
        type: 'object',
        properties: {
          accepted: { type: 'integer' },
        },
        required: ['accepted'],
      },
    },
  } as const;
}
