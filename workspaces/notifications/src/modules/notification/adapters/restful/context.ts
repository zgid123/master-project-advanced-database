import type { Env } from 'hono';

import type { TMongoose } from '#/infrastructure/mongoose/config';

import type { INotificationIoC } from './ioc';

export interface INotificationContextVariables extends Env {
  // biome-ignore lint/style/useNamingConvention: hono typing
  Variables: {
    mongoose: TMongoose;
    notification: INotificationIoC;
  };
}
