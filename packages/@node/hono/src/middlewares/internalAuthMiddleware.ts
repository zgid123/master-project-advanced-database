import type { Env } from 'hono';
import { createMiddleware } from 'hono/factory';
import { HonoError } from '@alphacifer/hono/core';

const INTERNAL_SERVICE_SECRET_HEADER = 'x-internal-service-secret';

interface IInternalAuthMiddlewareParams {
  secret?: string;
}

export function internalAuthMiddleware({
  secret,
}: IInternalAuthMiddlewareParams): ReturnType<typeof createMiddleware<Env>> {
  return createMiddleware<Env>(async (c, next) => {
    const providedSecret = c.req.header(INTERNAL_SERVICE_SECRET_HEADER);

    if (!secret || providedSecret !== secret) {
      throw new HonoError({
        status: 401,
        code: 10_002,
        name: 'UNAUTHORIZED_INTERNAL_SERVICE',
        message: 'Unauthorized internal service',
      });
    }

    return next();
  });
}
