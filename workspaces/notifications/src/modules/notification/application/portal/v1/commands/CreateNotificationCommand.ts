import type { ICommand } from '@domain/core';
import type {
  INotificationRepository,
  NotificationEntity,
  TCreateNotification,
} from '@domain/notification';

export class CreateNotificationCommand
  implements ICommand<TCreateNotification, NotificationEntity>
{
  readonly #notificationRepository: INotificationRepository;

  constructor(notificationRepository: INotificationRepository) {
    this.#notificationRepository = notificationRepository;
  }

  public async exec(params: TCreateNotification): Promise<NotificationEntity> {
    return this.#notificationRepository.create(params);
  }
}
