import { Hono } from 'hono';

import { baseEndpoints } from './base';
import { authEndpoints } from './portal/auth';
import { notificationsEndpoints } from './portal/notifications';
import { substackEndpoints } from './portal/substacks';

export const endpoints = new Hono()
  .route('/', baseEndpoints)
  .route('/v1/auth', authEndpoints)
  .route('/v1/notifications', notificationsEndpoints)
  .route('/v1/substacks', substackEndpoints);
