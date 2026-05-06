import { Hono } from 'hono';

import {
  authenticatedUserMiddleware,
  requiredAdminUserMiddlware,
  requiredUserMiddleware,
} from '#/modules/auth/adapters/restful/hono/middlewares/authMiddleware';

import type { ISubstackContextVariables } from '../../../context';

export const adminSubstackEndpoints = new Hono<ISubstackContextVariables>()
  .use(authenticatedUserMiddleware)
  .use(requiredUserMiddleware)
  .use(requiredAdminUserMiddlware)
  .post('/:slug/approve', async (c) => {
    const substack = await c.var.substack.admin.approveSubstackCommand.exec({
      slug: c.req.param('slug'),
    });

    return c.json({
      data: substack,
    });
  });
