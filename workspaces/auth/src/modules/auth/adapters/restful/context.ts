import type { UserEntity } from '@domain/auth';
import type { Env } from 'hono';

import type { TDrizzle } from '#/infrastructure/drizzle/config';

import type { AUTH_TOKEN_COOKIE_NAME } from './constants';
import type { IAuthIoC } from './ioc';

export interface IAuthContextVariables extends Env {
  // biome-ignore lint/style/useNamingConvention: hono typing
  Variables: {
    auth: IAuthIoC;
    drizzle: TDrizzle;
    currentUser: UserEntity;
    [AUTH_TOKEN_COOKIE_NAME]?: string;
  };
}
