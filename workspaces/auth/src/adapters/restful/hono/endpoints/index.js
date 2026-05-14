import { Hono } from 'hono';
import { authEndpoints } from '#/modules/auth/adapters/restful/hono/endpoints/portal/auth';
import { adminSubstackEndpoints } from '#/modules/substack/adapters/restful/hono/endpoints/admin/substacks';
import { substackEndpoints } from '#/modules/substack/adapters/restful/hono/endpoints/portal/substacks';
import { baseEndpoints } from './base';
export const endpoints = new Hono()
    .route('/', baseEndpoints)
    .route('/v1/auth', authEndpoints)
    .route('/admin/substacks', adminSubstackEndpoints)
    .route('/v1/substacks', substackEndpoints);
