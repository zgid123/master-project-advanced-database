import type { TUserProfile } from '@domain/auth';
import type { Env } from 'hono';

import type { IIoC } from './ioc';

export interface IApiGatewayContextVariables extends Env {
  // biome-ignore lint/style/useNamingConvention: hono typing
  Variables: IIoC & {
    authToken: string;
    currentUser: TUserProfile;
  };
}
