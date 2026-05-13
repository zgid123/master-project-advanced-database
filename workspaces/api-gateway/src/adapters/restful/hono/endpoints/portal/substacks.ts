import { Hono } from 'hono';

import type { IApiGatewayContextVariables } from '../../../context';
import { forwardUpstreamResponse } from '../../utils/upstreamResponseUtils';

export const substackEndpoints = new Hono<IApiGatewayContextVariables>()
  .get('/', async (c) => {
    const response = await c.var.authService.listSubstacks({
      search: new URL(c.req.url).search,
    });

    return forwardUpstreamResponse(c, response);
  })
  .get('/total', async (c) => {
    const response = await c.var.authService.getTotalSubstacks();

    return forwardUpstreamResponse(c, response);
  })
  .get('/owned', async (c) => {
    const authToken = c.get('authToken');
    const response = await c.var.authService.listOwnedSubstacks({
      authToken,
    });

    return forwardUpstreamResponse(c, response);
  })
  .get('/:slug', async (c) => {
    const response = await c.var.authService.getSubstackBySlug({
      slug: c.req.param('slug'),
    });

    return forwardUpstreamResponse(c, response);
  })
  .delete('/:slug', async (c) => {
    const authToken = c.get('authToken');
    const response = await c.var.authService.deleteSubstack({
      slug: c.req.param('slug'),
      authToken,
    });

    return forwardUpstreamResponse(c, response);
  })
  .put('/:slug', async (c) => {
    const authToken = c.get('authToken');
    const body = await c.req.text();
    const response = await c.var.authService.updateSubstack({
      slug: c.req.param('slug'),
      body,
      authToken,
    });

    return forwardUpstreamResponse(c, response);
  })
  .post('/', async (c) => {
    const authToken = c.get('authToken');
    const body = await c.req.text();
    const response = await c.var.authService.createSubstack({
      body,
      authToken,
    });

    return forwardUpstreamResponse(c, response);
  });
