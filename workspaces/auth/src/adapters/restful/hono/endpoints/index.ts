import { Hono } from 'hono';

import { authEndpoints } from '#/modules/auth/adapters/restful/hono/endpoints/portal/auth';
import { substackEndpoints } from '#/modules/substack/adapters/restful/hono/endpoints/portal/substack';

import { baseEndpoints } from './base';

export const endpoints = new Hono()
  .route('/', baseEndpoints)
  .route('/v1/auth', authEndpoints)
  .route('/v1/substacks', substackEndpoints);
