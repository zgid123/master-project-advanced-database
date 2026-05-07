import type { NotificationEntity } from '../entities';
import type { TCreateNotification } from '../schemas';

export interface IFindNotificationsParams {
  userId: string;
  read?: boolean;
  limit?: number;
}

export interface IMarkNotificationAsReadParams {
  id: string;
  userId: string;
}

export interface INotificationRepository {
  create(params: TCreateNotification): Promise<NotificationEntity>;
  find(params: IFindNotificationsParams): Promise<NotificationEntity[]>;
  markAsRead(
    params: IMarkNotificationAsReadParams,
  ): Promise<NotificationEntity | null>;
}
