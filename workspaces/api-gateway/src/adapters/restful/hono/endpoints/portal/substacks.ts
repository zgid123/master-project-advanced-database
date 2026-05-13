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
    const response = await c.var.authService.listOwnedSubstacks({
      authToken: c.get('authToken'),
    });

    return forwardUpstreamResponse(c, response, {
      excludedHeaders: ['set-cookie'],
    });
  })
  .get('/:slug', async (c) => {
    const response = await c.var.authService.getSubstackBySlug({
      slug: c.req.param('slug'),
    });

    return forwardUpstreamResponse(c, response);
  })
  .post('/', async (c) => {
    const response = await c.var.authService.createSubstack({
      authToken: c.get('authToken'),
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
    });

    return forwardUpstreamResponse(c, response, {
      excludedHeaders: ['set-cookie'],
    });
  })
  .put('/:slug', async (c) => {
    const response = await c.var.authService.updateSubstack({
      authToken: c.get('authToken'),
      body: await c.req.text(),
      contentType: c.req.header('content-type') ?? 'application/json',
      slug: c.req.param('slug'),
    });

    return forwardUpstreamResponse(c, response, {
      excludedHeaders: ['set-cookie'],
    });
  })
  .delete('/:slug', async (c) => {
    const response = await c.var.authService.deleteSubstack({
      authToken: c.get('authToken'),
      slug: c.req.param('slug'),
    });

    return forwardUpstreamResponse(c, response, {
      excludedHeaders: ['set-cookie'],
    });
  })
  .post('/:slug/subscribe', async (c) => {
    const response = await c.var.authService.subscribeSubstack({
      authToken: c.get('authToken'),
      slug: c.req.param('slug'),
    });

    return forwardUpstreamResponse(c, response, {
      excludedHeaders: ['set-cookie'],
    });
  })
  .delete('/:slug/subscribe', async (c) => {
    const response = await c.var.authService.unsubscribeSubstack({
      authToken: c.get('authToken'),
      slug: c.req.param('slug'),
    });

    return forwardUpstreamResponse(c, response, {
      excludedHeaders: ['set-cookie'],
    });
  });
