import type { TMongoose } from '#/infrastructure/mongoose/config';
import {
  type INotificationIoC,
  registerNotificationIoC,
} from '#/modules/notification/adapters/restful/ioc';

export interface IIoC {
  mongoose: TMongoose;
  notification: INotificationIoC;
  [key: string]: unknown;
}

interface IRegisterIoCParams {
  mongoose: TMongoose;
}

export function registerIoC({ mongoose }: IRegisterIoCParams): IIoC {
  return {
    mongoose,
    notification: registerNotificationIoC(),
  };
}
