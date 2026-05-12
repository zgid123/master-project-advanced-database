import { AuthService } from '#/services/AuthService';
import { NotificationService } from '#/services/NotificationService';
import { QnaService } from '#/services/QnaService';

export interface IIoC {
  authService: AuthService;
  notificationService: NotificationService;
  qnaService: QnaService;
  [key: string]: unknown;
}

export function registerIoC(): IIoC {
  return {
    authService: new AuthService(),
    notificationService: new NotificationService(),
    qnaService: new QnaService(),
  };
}
