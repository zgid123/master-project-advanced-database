import type { Env } from 'hono';
import { createMiddleware } from 'hono/factory';

interface ICreateLoggerMiddlewareParams {
  serverName: string;
}

export function createLoggerMiddleware({
  serverName,
}: ICreateLoggerMiddlewareParams): ReturnType<typeof createMiddleware<Env>> {
  return createMiddleware<Env>((c, next) => {
    console.info(`[${serverName}] ${c.req.method} ${c.req.path}`);

    return next();
  });
}
