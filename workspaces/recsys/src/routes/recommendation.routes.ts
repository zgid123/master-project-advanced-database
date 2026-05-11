import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { HttpError } from '../errors.js';
import {
  getPersonalizedFeed,
  getSimilarTopics,
  getTrendingFeed,
  suggestSubstacks,
} from '../recommendation/service.js';

const idSchema = z
  .union([z.string().min(1), z.number().int()])
  .transform(String);

const feedQuerySchema = z.object({
  userId: idSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const limitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const trendingQuerySchema = limitQuerySchema.extend({
  substackId: idSchema.optional(),
});

const topicParamSchema = z.object({
  id: idSchema,
});

const userParamSchema = z.object({
  id: idSchema,
});

export async function recommendationRoutes(app: FastifyInstance) {
  app.get(
    '/v1/feed',
    {
      schema: {
        tags: ['Recommendations'],
        summary: 'Get a personalized topic feed',
        querystring: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Prototype user id. x-user-id may be used instead.',
            },
            cursor: { type: 'string', description: 'Base64url keyset cursor' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    async (request) => {
      const query = feedQuerySchema.parse(request.query);
      const userId = query.userId ?? getHeaderString(request, 'x-user-id');

      if (!userId) {
        throw new HttpError(
          400,
          'USER_ID_REQUIRED',
          'userId query parameter or x-user-id header is required',
        );
      }

      return getPersonalizedFeed(userId, query.limit, query.cursor);
    },
  );

  app.get(
    '/v1/trending',
    {
      schema: {
        tags: ['Recommendations'],
        summary: 'Get global or substack-scoped trending topics',
        querystring: {
          type: 'object',
          properties: {
            substackId: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    async (request) => {
      const { limit, substackId } = trendingQuerySchema.parse(request.query);
      return getTrendingFeed(limit, substackId ?? null);
    },
  );

  app.get(
    '/v1/topics/:id/similar',
    {
      schema: {
        tags: ['Recommendations'],
        summary: 'Get topics related to the supplied topic id',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    async (request) => {
      const { id } = topicParamSchema.parse(request.params);
      const { limit } = limitQuerySchema.parse(request.query);
      return getSimilarTopics(id, limit);
    },
  );

  app.get(
    '/v1/similar/topics/:id',
    {
      schema: {
        tags: ['Recommendations'],
        summary: 'Get topics similar to a given topic',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    async (request) => {
      const { id } = topicParamSchema.parse(request.params);
      const { limit } = limitQuerySchema.parse(request.query);
      return getSimilarTopics(id, limit);
    },
  );

  app.get(
    '/v1/users/:id/suggested-substacks',
    {
      schema: {
        tags: ['Recommendations'],
        summary: 'Suggest substacks for onboarding and discovery',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    async (request) => {
      const { id } = userParamSchema.parse(request.params);
      const { limit } = limitQuerySchema.parse(request.query);
      return suggestSubstacks(id, limit);
    },
  );
}

function getHeaderString(
  request: FastifyRequest,
  name: string,
): string | undefined {
  const value = request.headers[name];
  if (Array.isArray(value)) return value[0];
  return value;
}
