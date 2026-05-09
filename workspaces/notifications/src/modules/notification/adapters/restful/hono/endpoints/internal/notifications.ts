import { arkValidator } from '@alphacifer/hono/core';
import {
  CreateSystemNotification,
  CreateSystemNotificationsBatch,
} from '@domain/notification';
import { internalAuthMiddleware } from '@node/hono/middlewares';
import { Hono, type ValidationTargets } from 'hono';

import type { INotificationContextVariables } from '../../../context';

export const internalNotificationEndpoints =
  new Hono<INotificationContextVariables>()
    .post(
      '/batch',
      internalAuthMiddleware({
        secret: process.env.INTERNAL_SERVICE_SECRET,
      }),
      arkValidator<
        typeof CreateSystemNotificationsBatch,
        keyof ValidationTargets,
        INotificationContextVariables,
        string
      >('json', CreateSystemNotificationsBatch),
      async (c) => {
        const { req, var: v } = c;
        const data = req.valid('json');

        const notifications = await Promise.all(
          data.notifications.map((systemNotification) => {
            const notificationParams =
              v.notification.systemNotificationService.create(
                systemNotification,
              );

            return v.notification.internal.createNotificationCommand.exec(
              notificationParams,
            );
          }),
        );

        return c.json(
          {
            data: notifications,
          },
          201,
        );
      },
    )
    .post(
      '/',
      internalAuthMiddleware({
        secret: process.env.INTERNAL_SERVICE_SECRET,
      }),
      arkValidator<
        typeof CreateSystemNotification,
        keyof ValidationTargets,
        INotificationContextVariables,
        string
      >('json', CreateSystemNotification),
      async (c) => {
        const { req, var: v } = c;
        const data = req.valid('json');
        const notificationParams =
          v.notification.systemNotificationService.create(data);

        const notification =
          await v.notification.internal.createNotificationCommand.exec(
            notificationParams,
          );

        return c.json(
          {
            data: notification,
          },
          201,
        );
      },
    );
