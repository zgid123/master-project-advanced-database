import {
  arkValidator,
  HonoCommonError,
  HonoError,
} from '@alphacifer/hono/core';
import { CreateNotification } from '@domain/notification';
import { parsePagy } from '@node/utils';
import { Hono, type ValidationTargets } from 'hono';

import type { INotificationContextVariables } from '../../../context';

export const notificationEndpoints = new Hono<INotificationContextVariables>()
  .get('/', async (c) => {
    const { read, userId, limit } = c.req.query();
    const pagy = parsePagy({ limit });

    if (!userId) {
      throw HonoCommonError.invalidParams({
        detail: {
          userId: 'Expected a non-empty string',
        },
      });
    }

    const notifications =
      await c.var.notification.portal.getNotificationsQuery.exec({
        userId,
        read: Boolean(read),
        limit: Math.min(pagy.limit, 50),
      });

    return c.json({
      data: notifications,
    });
  })
  .patch('/:id/read', async (c) => {
    const { id } = c.req.param();
    const { userId } = c.req.query();

    const detail: Record<string, string> = {};

    if (!id) {
      detail.id = 'Expected a non-empty string';
    }

    if (!userId) {
      detail.userId = 'Expected a non-empty string';
    }

    if (!id || !userId) {
      throw HonoCommonError.invalidParams({
        detail,
      });
    }

    const notification =
      await c.var.notification.portal.markNotificationAsReadCommand.exec({
        id,
        userId,
      });

    if (!notification) {
      throw new HonoError({
        status: 404,
        code: 404,
        name: 'NOTIFICATION_NOT_FOUND',
        message: 'Notification not found',
      });
    }

    return c.json({
      data: notification,
    });
  })
  .post(
    '/',
    arkValidator<
      typeof CreateNotification,
      keyof ValidationTargets,
      INotificationContextVariables,
      string
    >('json', CreateNotification),
    async (c) => {
      const { req, var: v } = c;
      const data = req.valid('json');

      const notification =
        await v.notification.portal.createNotificationCommand.exec(data);

      return c.json(
        {
          data: notification,
        },
        201,
      );
    },
  );
