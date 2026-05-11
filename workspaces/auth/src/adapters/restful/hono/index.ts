import { migrate } from '@alphacifer/drizzle/core';
import { onError } from '@alphacifer/hono/core';
import { type ServerType, serve } from '@hono/node-server';
import type { ICoreDrizzleContextVariables } from '@node/hono/interfaces';
import {
  createDrizzleMiddleware,
  createLoggerMiddleware,
  createRegisterIoCMiddleware,
} from '@node/hono/middlewares';
import { detect } from 'detect-port';
import { Hono } from 'hono';
import type { ExtractSchema } from 'hono/types';

import type { TDrizzle } from '#/infrastructure/drizzle/config';
import { drizzle } from '#/infrastructure/drizzle/instance';
import { seed } from '#/infrastructure/drizzle/seeds';

import { registerIoC } from '../ioc';
import { endpoints } from './endpoints';

export type TApp = Hono<
  ICoreDrizzleContextVariables<TDrizzle>,
  ExtractSchema<typeof endpoints>,
  '/'
>;

interface IInitHonoReturn {
  app: TApp;
  server: ServerType;
}

interface IInitHonoParams {
  beforeInitRoutes?: (app: TApp) => void;
}

export async function initHono({
  beforeInitRoutes,
}: IInitHonoParams = {}): Promise<IInitHonoReturn> {
  const app = new Hono<ICoreDrizzleContextVariables<TDrizzle>>();
  const isTest = !!process.env.VITEST_WORKER_ID;

  if (!isTest) {
    await migrate(drizzle, {
      migrationsTable: 'orm_migrations',
      migrationsFolder: './src/infrastructure/drizzle/migrations',
    });

    await seed(drizzle);
  }

  const ioc = registerIoC({
    drizzle,
  });

  app
    .use(
      createLoggerMiddleware({
        serverName: 'auth',
      }),
    )
    .use(
      createDrizzleMiddleware({
        drizzle,
      }),
    )
    .use(
      createRegisterIoCMiddleware({
        ioc,
      }),
    );

  beforeInitRoutes?.(app);

  app.route('', endpoints).onError((error, c) => {
    return onError(error, c);
  });

  const server = serve(
    {
      fetch: app.fetch,
      port: await detect(
        isTest ? 6_000 + Number(process.env.VITEST_WORKER_ID) : 3_001,
      ),
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
