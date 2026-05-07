import type { NotificationEntity } from '../entities';
import type { TCreateNotification } from '../schemas';

export interface IFindNotificationsParams {
  userId: string;
  read?: boolean;
  limit?: number;
}

export interface INotificationRepository {
  create(params: TCreateNotification): Promise<NotificationEntity>;
  find(params: IFindNotificationsParams): Promise<NotificationEntity[]>;
}
