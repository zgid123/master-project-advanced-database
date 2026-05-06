import { onError } from '@alphacifer/hono/core';
import { type ServerType, serve } from '@hono/node-server';
import type { ICoreMongooseContextVariables } from '@node/hono/interfaces';
import {
  createMongooseMiddleware,
  createRegisterIoCMiddleware,
} from '@node/hono/middlewares';
import { detect } from 'detect-port';
import { Hono } from 'hono';
import type { ExtractSchema } from 'hono/types';

import {
  createMongoose,
  type TMongoose,
} from '#/infrastructure/mongoose/config';

import { registerIoC } from '../ioc';
import { endpoints } from './endpoints';

export type TApp = Hono<
  ICoreMongooseContextVariables<TMongoose>,
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
  const app = new Hono<ICoreMongooseContextVariables<TMongoose>>();

  const mongoose = await createMongoose();

  const ioc = registerIoC({
    mongoose,
  });

  app
    .use(
      createMongooseMiddleware({
        mongoose,
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

  const isTest = !!process.env.VITEST_WORKER_ID;

  const server = serve(
    {
      fetch: app.fetch,
      port: await detect(
        isTest ? 7_000 + Number(process.env.VITEST_WORKER_ID) : 3_002,
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
