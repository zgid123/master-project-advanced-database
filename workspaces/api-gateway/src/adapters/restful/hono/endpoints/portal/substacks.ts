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
  });
