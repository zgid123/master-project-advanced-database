import { Hono } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

import type { IApiGatewayContextVariables } from '../../../context';

function createNotificationResponseHeaders(response: Response): Headers {
  const headers = new Headers(response.headers);

  headers.delete('content-encoding');
  headers.delete('content-length');

  return headers;
}

export const notificationsEndpoints =
  new Hono<IApiGatewayContextVariables>().get('/', async (c) => {
    const { req, var: v } = c;

    const response = await v.notificationService.listNotifications({
      search: new URL(req.url).search,
    });
    const body = await response.text();

    return c.newResponse(body, {
      statusText: response.statusText,
      status: response.status as StatusCode,
      headers: createNotificationResponseHeaders(response),
    });
  });
