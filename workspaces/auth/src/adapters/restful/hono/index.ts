import { migrate } from '@alphacifer/drizzle/core';
import { onError } from '@alphacifer/hono/core';
import { type ServerType, serve } from '@hono/node-server';
import { detect } from 'detect-port';
import type { Env } from 'hono';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { ExtractSchema } from 'hono/types';

import type { TDrizzle } from '#/infrastructure/drizzle/config';
import { drizzle } from '#/infrastructure/drizzle/instance';
import { seed } from '#/infrastructure/drizzle/seeds';

import { type IIoC, registerIoC } from '../ioc';
import { endpoints } from './endpoints';

interface ICoreContextVariables<TDrizzle> extends Env {
  // biome-ignore lint/style/useNamingConvention: hono typing
  Variables: {
    drizzle: TDrizzle;
  } & IIoC;
}

export type TApp = Hono<
  ICoreContextVariables<TDrizzle>,
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

function createDrizzleMiddleware(drizzle: TDrizzle) {
  return createMiddleware<ICoreContextVariables<TDrizzle>>((c, next) => {
    c.set('drizzle', drizzle);

    return next();
  });
}

function createRegisterIoCMiddleware(ioc: IIoC) {
  return createMiddleware<ICoreContextVariables<TDrizzle>>((c, next) => {
    Object.entries(ioc).forEach(([key, value]) => {
      c.set(key, value);
    });

    return next();
  });
}

export async function initHono({
  beforeInitRoutes,
}: IInitHonoParams = {}): Promise<IInitHonoReturn> {
  const app = new Hono<ICoreContextVariables<TDrizzle>>();
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
    .use(createDrizzleMiddleware(drizzle))
    .use(createRegisterIoCMiddleware(ioc));

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
