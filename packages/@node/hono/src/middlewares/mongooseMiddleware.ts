import { createMiddleware } from 'hono/factory';

import type { ICoreMongooseContextVariables } from '../interfaces/context';

interface ICreateMongooseMiddlewareParams<TMongoose> {
  mongoose: TMongoose;
}

export function createMongooseMiddleware<TMongoose>({
  mongoose,
}: ICreateMongooseMiddlewareParams<TMongoose>): ReturnType<
  typeof createMiddleware<ICoreMongooseContextVariables<TMongoose>>
> {
  return createMiddleware<ICoreMongooseContextVariables<TMongoose>>(
    (c, next) => {
      c.set('mongoose', mongoose);

      return next();
    },
  );
}
