import { Hono } from 'hono';

import { authEndpoints } from '#/modules/auth/adapters/restful/hono/endpoints/portal/auth';

import { baseEndpoints } from './base';

export const endpoints = new Hono()
  .route('/', baseEndpoints)
  .route('/v1/auth', authEndpoints);
