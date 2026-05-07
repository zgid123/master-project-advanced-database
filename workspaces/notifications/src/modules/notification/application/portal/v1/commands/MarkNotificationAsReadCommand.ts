import type { ICommand } from '@domain/core';
import type {
  IMarkNotificationAsReadParams,
  INotificationRepository,
  NotificationEntity,
} from '@domain/notification';

export class MarkNotificationAsReadCommand
  implements ICommand<IMarkNotificationAsReadParams, NotificationEntity | null>
{
  readonly #notificationRepository: INotificationRepository;

  constructor(notificationRepository: INotificationRepository) {
    this.#notificationRepository = notificationRepository;
  }

  public async exec({
    id,
    userId,
  }: IMarkNotificationAsReadParams): Promise<NotificationEntity | null> {
    return this.#notificationRepository.markAsRead({
      id,
      userId,
    });
  }
}
