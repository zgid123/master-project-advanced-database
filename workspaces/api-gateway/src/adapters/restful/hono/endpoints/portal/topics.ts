import { Hono } from 'hono';

import type { IApiGatewayContextVariables } from '../../../context';
import { forwardUpstreamResponse } from '../../utils/upstreamResponseUtils';

export const topicsEndpoints = new Hono<IApiGatewayContextVariables>()
  .get('/search', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const search = new URL(c.req.url).search;
    const response = await c.var.qnaService.request({
      method: 'GET',
      path: `/topics/search${search}`,
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .post('/', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'POST',
      path: '/topics',
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .get('/:id', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'GET',
      path: `/topics/${encodeURIComponent(c.req.param('id'))}`,
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .patch('/:id', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'PATCH',
      path: `/topics/${encodeURIComponent(c.req.param('id'))}`,
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .delete('/:id', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const search = new URL(c.req.url).search;
    const response = await c.var.qnaService.request({
      method: 'DELETE',
      path: `/topics/${encodeURIComponent(c.req.param('id'))}${search}`,
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .patch('/:id/solve', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const search = new URL(c.req.url).search;
    const response = await c.var.qnaService.request({
      method: 'PATCH',
      path: `/topics/${encodeURIComponent(c.req.param('id'))}/solve${search}`,
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .get('/:id/comments', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'GET',
      path: `/topics/${encodeURIComponent(c.req.param('id'))}/comments`,
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .post('/:id/vote', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'POST',
      path: `/topics/${encodeURIComponent(c.req.param('id'))}/vote`,
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .delete('/:id/vote', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const search = new URL(c.req.url).search;
    const response = await c.var.qnaService.request({
      method: 'DELETE',
      path: `/topics/${encodeURIComponent(c.req.param('id'))}/vote${search}`,
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .post('/:id/subscribe', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'POST',
      path: `/topics/${encodeURIComponent(c.req.param('id'))}/subscribe`,
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .post('/:id/unsubscribe', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'POST',
      path: `/topics/${encodeURIComponent(c.req.param('id'))}/unsubscribe`,
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  });
