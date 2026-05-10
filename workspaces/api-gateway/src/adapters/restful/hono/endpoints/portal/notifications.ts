import { Hono } from 'hono';

import type { IApiGatewayContextVariables } from '../../../context';
import { forwardUpstreamResponse } from '../../utils/upstreamResponseUtils';

export const notificationsEndpoints =
  new Hono<IApiGatewayContextVariables>().get('/', async (c) => {
    const { req, var: v } = c;

    const response = await v.notificationService.listNotifications({
      search: new URL(req.url).search,
    });

    return forwardUpstreamResponse(c, response);
  });
