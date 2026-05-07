import { CreateNotificationCommand } from '../../application/portal/v1/commands';
import { GetNotificationsQuery } from '../../application/portal/v1/queries';
import { NotificationRepository } from '../../infrastructure/mongoose/repositories';

export interface INotificationIoC {
  portal: {
    getNotificationsQuery: GetNotificationsQuery;
    createNotificationCommand: CreateNotificationCommand;
  };
}

export function registerNotificationIoC(): INotificationIoC {
  const notificationRepository = new NotificationRepository();
  const createNotificationCommand = new CreateNotificationCommand(
    notificationRepository,
  );
  const getNotificationsQuery = new GetNotificationsQuery(
    notificationRepository,
  );

  return {
    portal: {
      getNotificationsQuery,
      createNotificationCommand,
    },
  };
}
