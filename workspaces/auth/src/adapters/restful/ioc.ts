import type { TDrizzle } from '#/infrastructure/drizzle/config';
import {
  type IAuthIoC,
  registerAuthIoC,
} from '#/modules/auth/adapters/restful/ioc';
import {
  type ISubstackIoC,
  registerSubstackIoC,
} from '#/modules/substack/adapters/restful/ioc';

export interface IIoC {
  auth: IAuthIoC;
  drizzle: TDrizzle;
  substack: ISubstackIoC;
  [key: string]: unknown;
}

interface IRegisterIoCParams {
  drizzle: TDrizzle;
}

export function registerIoC({ drizzle }: IRegisterIoCParams): IIoC {
  return {
    drizzle,
    auth: registerAuthIoC({
      drizzle,
    }),
    substack: registerSubstackIoC({
      drizzle,
    }),
  };
}
