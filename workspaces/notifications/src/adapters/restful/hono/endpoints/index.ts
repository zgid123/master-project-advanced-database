import { Hono } from 'hono';

import { internalNotificationEndpoints } from '#/modules/notification/adapters/restful/hono/endpoints/internal/notifications';
import { notificationEndpoints } from '#/modules/notification/adapters/restful/hono/endpoints/portal/notifications';

import { baseEndpoints } from './base';

export const endpoints = new Hono()
  .route('/', baseEndpoints)
  .route('/internal/v1/notifications', internalNotificationEndpoints)
  .route('/v1/notifications', notificationEndpoints);
