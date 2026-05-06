import type { TDrizzle } from '#/infrastructure/drizzle/config';
import {
  type IAuthIoC,
  registerAuthIoC,
} from '#/modules/auth/adapters/restful/ioc';

export interface IIoC {
  drizzle: TDrizzle;
  auth: IAuthIoC;
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
  };
}
