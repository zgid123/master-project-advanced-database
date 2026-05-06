import type { Env } from 'hono';
import { createMiddleware } from 'hono/factory';

interface ICreateRegisterIoCMiddlewareParams<TIoC> {
  ioc: TIoC;
}

export function createRegisterIoCMiddleware<
  TIoC extends Record<string, unknown>,
>({
  ioc,
}: ICreateRegisterIoCMiddlewareParams<TIoC>): ReturnType<
  typeof createMiddleware<Env>
> {
  return createMiddleware<Env>((c, next) => {
    Object.entries(ioc).forEach(([key, value]) => {
      c.set(key as never, value as never);
    });

    return next();
  });
}
