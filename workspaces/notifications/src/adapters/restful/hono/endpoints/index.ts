import { Hono } from 'hono';

import { notificationEndpoints } from '#/modules/notification/adapters/restful/hono/endpoints/portal/notifications';

import { baseEndpoints } from './base';

export const endpoints = new Hono()
  .route('/', baseEndpoints)
  .route('/v1/notifications', notificationEndpoints);
