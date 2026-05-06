import type { TMongoose } from '#/infrastructure/mongoose/config';

export interface IIoC {
  mongoose: TMongoose;
  [key: string]: unknown;
}

interface IRegisterIoCParams {
  mongoose: TMongoose;
}

export function registerIoC({ mongoose }: IRegisterIoCParams): IIoC {
  return {
    mongoose,
  };
}
