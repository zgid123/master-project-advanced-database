import type { TDrizzle } from '#/infrastructure/drizzle/config';

export interface IIoC {
  drizzle: TDrizzle;
  [key: string]: unknown;
}

interface IRegisterIoCParams {
  drizzle: TDrizzle;
}

export function registerIoC({ drizzle }: IRegisterIoCParams): IIoC {
  return {
    drizzle,
  };
}
