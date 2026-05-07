import {
  CreateNotificationCommand,
  MarkNotificationAsReadCommand,
} from '../../application/portal/v1/commands';
import { GetNotificationsQuery } from '../../application/portal/v1/queries';
import { NotificationRepository } from '../../infrastructure/mongoose/repositories';

export interface INotificationIoC {
  portal: {
    getNotificationsQuery: GetNotificationsQuery;
    createNotificationCommand: CreateNotificationCommand;
    markNotificationAsReadCommand: MarkNotificationAsReadCommand;
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
  const markNotificationAsReadCommand = new MarkNotificationAsReadCommand(
    notificationRepository,
  );

  return {
    portal: {
      getNotificationsQuery,
      createNotificationCommand,
      markNotificationAsReadCommand,
    },
  };
}
