import { Hono } from 'hono';

import type { IApiGatewayContextVariables } from '../../../context';
import { forwardUpstreamResponse } from '../../utils/upstreamResponseUtils';

export const notificationsEndpoints =
  new Hono<IApiGatewayContextVariables>()
    .get('/', async (c) => {
      const { req, var: v } = c;
      const userId = c.get('currentUser')?.id ?? '';
      const url = new URL(req.url);
      url.searchParams.set('userId', userId);

      const response = await v.notificationService.listNotifications({
        search: url.search,
      });

      return forwardUpstreamResponse(c, response);
    })
    .patch('/:id/read', async (c) => {
      const response = await c.var.notificationService.markNotificationAsRead({
        id: c.req.param('id'),
        userId: c.get('currentUser')?.id ?? '',
      });

      return forwardUpstreamResponse(c, response);
    });
