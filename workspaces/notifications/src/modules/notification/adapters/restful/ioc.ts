import {
  CreateNotificationCommand,
  MarkNotificationAsReadCommand,
} from '../../application/portal/v1/commands';
import { GetNotificationsQuery } from '../../application/portal/v1/queries';
import { SystemNotificationService } from '../../domain/services';
import { NotificationRepository } from '../../infrastructure/mongoose/repositories';

export interface INotificationIoC {
  systemNotificationService: SystemNotificationService;
  portal: {
    getNotificationsQuery: GetNotificationsQuery;
    markNotificationAsReadCommand: MarkNotificationAsReadCommand;
  };
  internal: {
    createNotificationCommand: CreateNotificationCommand;
  };
}

export function registerNotificationIoC(): INotificationIoC {
  const notificationRepository = new NotificationRepository();
  const getNotificationsQuery = new GetNotificationsQuery(
    notificationRepository,
  );
  const markNotificationAsReadCommand = new MarkNotificationAsReadCommand(
    notificationRepository,
  );
  const createNotificationCommand = new CreateNotificationCommand(
    notificationRepository,
  );
  const systemNotificationService = new SystemNotificationService();

  return {
    systemNotificationService,
    portal: {
      getNotificationsQuery,
      markNotificationAsReadCommand,
    },
    internal: {
      createNotificationCommand,
    },
  };
}
