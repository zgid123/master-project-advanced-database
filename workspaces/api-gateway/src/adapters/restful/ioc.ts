import { AuthService } from '#/services/AuthService';
import { NotificationService } from '#/services/NotificationService';

export interface IIoC {
  authService: AuthService;
  notificationService: NotificationService;
  [key: string]: unknown;
}

export function registerIoC(): IIoC {
  return {
    authService: new AuthService(),
    notificationService: new NotificationService(),
  };
}
