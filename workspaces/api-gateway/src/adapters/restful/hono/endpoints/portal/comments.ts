import { Hono } from 'hono';

import type { IApiGatewayContextVariables } from '../../../context';
import { forwardUpstreamResponse } from '../../utils/upstreamResponseUtils';

export const commentsEndpoints = new Hono<IApiGatewayContextVariables>()
  .post('/', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'POST',
      path: '/comments',
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .patch('/:id', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'PATCH',
      path: `/comments/${encodeURIComponent(c.req.param('id'))}`,
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .delete('/:id', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'DELETE',
      path: `/comments/${encodeURIComponent(c.req.param('id'))}`,
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .patch('/:id/accept', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'PATCH',
      path: `/comments/${encodeURIComponent(c.req.param('id'))}/accept`,
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  })
  .post('/:id/vote', async (c) => {
    const userId = c.get('currentUser')?.id ?? '';
    const response = await c.var.qnaService.request({
      method: 'POST',
      path: `/comments/${encodeURIComponent(c.req.param('id'))}/vote`,
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      headers: userId ? { 'x-user-id': userId } : {},
    });

    return forwardUpstreamResponse(c, response);
  });
