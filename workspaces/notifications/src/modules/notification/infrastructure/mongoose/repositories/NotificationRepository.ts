import {
  type IFindNotificationsParams,
  type IMarkNotificationAsReadParams,
  type INotificationRepository,
  NotificationEntity,
  type TCreateNotification,
  type TNotification,
} from '@domain/notification';
import { isValidObjectId, type QueryFilter } from 'mongoose';

import { NotificationModel } from '#/infrastructure/mongoose/schemas';

export class NotificationRepository implements INotificationRepository {
  public async create(
    params: TCreateNotification,
  ): Promise<NotificationEntity> {
    const notification = await NotificationModel.create({
      ...params,
      sent: true,
      read: false,
    });

    return NotificationEntity.create(notification);
  }

  public async find({
    read,
    limit,
    userId,
  }: IFindNotificationsParams): Promise<NotificationEntity[]> {
    const filters: QueryFilter<TNotification> = {
      userId,
    };

    if (read !== undefined) {
      filters.read = read;
    }

    const query = NotificationModel.find(filters).sort({
      createdAt: -1,
    });

    if (limit !== undefined) {
      query.limit(limit);
    }

    const notifications = await query.exec();

    return notifications.map((notification) => {
      return NotificationEntity.create(notification);
    });
  }

  public async markAsRead({
    id,
    userId,
  }: IMarkNotificationAsReadParams): Promise<NotificationEntity | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: id,
        userId,
      },
      {
        read: true,
      },
      {
        new: true,
      },
    ).exec();

    if (!notification) {
      return null;
    }

    return NotificationEntity.create(notification);
  }
}
