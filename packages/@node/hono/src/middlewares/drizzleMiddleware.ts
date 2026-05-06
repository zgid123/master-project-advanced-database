import { createMiddleware } from 'hono/factory';

import type { ICoreDrizzleContextVariables } from '../interfaces/context';

interface ICreateDrizzleMiddlewareParams<TDrizzle> {
  drizzle: TDrizzle;
}

export function createDrizzleMiddleware<TDrizzle>({
  drizzle,
}: ICreateDrizzleMiddlewareParams<TDrizzle>): ReturnType<
  typeof createMiddleware<ICoreDrizzleContextVariables<TDrizzle>>
> {
  return createMiddleware<ICoreDrizzleContextVariables<TDrizzle>>((c, next) => {
    c.set('drizzle', drizzle);

    return next();
  });
}
