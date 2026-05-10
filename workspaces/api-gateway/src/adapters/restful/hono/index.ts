import { type ServerType, serve } from '@hono/node-server';
import { createRegisterIoCMiddleware } from '@node/hono/middlewares';
import { Hono } from 'hono';
import type { ExtractSchema } from 'hono/types';

import type { IApiGatewayContextVariables } from '../context';
import { registerIoC } from '../ioc';
import { endpoints } from './endpoints';
import { authMiddleware } from './middlewares';

export type TApp = Hono<
  IApiGatewayContextVariables,
  ExtractSchema<typeof endpoints>
>;

interface IInitHonoReturn {
  app: TApp;
  server: ServerType;
}

interface IInitHonoParams {
  beforeInitRoutes?: (app: TApp) => void;
}

export function initHono({
  beforeInitRoutes,
}: IInitHonoParams = {}): IInitHonoReturn {
  const app = new Hono<IApiGatewayContextVariables>();
  const ioc = registerIoC();

  app.use(
    createRegisterIoCMiddleware({
      ioc,
    }),
  );

  app.use('*', authMiddleware);

  beforeInitRoutes?.(app);

  app.route('', endpoints).onError((error, c) => {
    console.error(error);

    return c.json(
      {
        message: 'Internal Server Error',
      },
      500,
    );
  });

  const server = serve(
    {
      fetch: app.fetch,
      port: Number(process.env.PORT ?? 3_000),
    },
    ({ port }) => {
      console.log(`Server is running on http://localhost:${port}`);
    },
  );

  return {
    app,
    server,
  };
}
