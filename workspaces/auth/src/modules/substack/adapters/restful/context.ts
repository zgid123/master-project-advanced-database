import type { UserEntity } from '@domain/auth';
import type { Env } from 'hono';

import type { TDrizzle } from '#/infrastructure/drizzle/config';
import type { IAuthIoC } from '#/modules/auth/adapters/restful/ioc';

import type { ISubstackIoC } from './ioc';

export interface ISubstackContextVariables extends Env {
  // biome-ignore lint/style/useNamingConvention: hono typing
  Variables: {
    auth: IAuthIoC;
    drizzle: TDrizzle;
    substack: ISubstackIoC;
    currentUser: UserEntity;
  };
}
