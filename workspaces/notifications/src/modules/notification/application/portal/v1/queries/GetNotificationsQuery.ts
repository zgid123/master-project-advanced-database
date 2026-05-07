import type { IQuery } from '@domain/core';
import type {
  IFindNotificationsParams,
  INotificationRepository,
  NotificationEntity,
} from '@domain/notification';

export class GetNotificationsQuery
  implements IQuery<IFindNotificationsParams, NotificationEntity[]>
{
  readonly #notificationRepository: INotificationRepository;

  constructor(notificationRepository: INotificationRepository) {
    this.#notificationRepository = notificationRepository;
  }

  public async exec({
    read,
    limit,
    userId,
  }: IFindNotificationsParams): Promise<NotificationEntity[]> {
    return this.#notificationRepository.find({
      read,
      limit,
      userId,
    });
  }
}
