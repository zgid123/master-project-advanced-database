import { arkValidator } from '@alphacifer/hono/core';
import { CreateSubstack } from '@domain/auth';
import { Hono, type ValidationTargets } from 'hono';

import {
  authenticatedUserMiddleware,
  requiredUserMiddleware,
} from '#/modules/auth/adapters/restful/hono/middlewares/authMiddleware';

import type { ISubstackContextVariables } from '../../../context';

const CreateSubstackRequest = CreateSubstack.omit('ownerId');

export const substackEndpoints = new Hono<ISubstackContextVariables>()
  .use(authenticatedUserMiddleware)
  .use(requiredUserMiddleware)
  .get('/', async (c) => {
    const substacks = await c.var.substack.portal.getSubstacksQuery.exec();

    return c.json({
      data: substacks,
    });
  })
  .get('/:slug', async (c) => {
    const substack = await c.var.substack.portal.getSubstackQuery.exec({
      slug: c.req.param('slug'),
    });

    return c.json({
      data: substack,
    });
  })
  .post(
    '/',
    arkValidator<
      typeof CreateSubstackRequest,
      keyof ValidationTargets,
      ISubstackContextVariables,
      string
    >('json', CreateSubstackRequest),
    async (c) => {
      const { req, var: v } = c;
      const currentUser = c.get('currentUser');
      const data = req.valid('json');

      const substack = await v.substack.portal.createSubstackCommand.exec({
        ...data,
        ownerId: currentUser.id,
      });

      return c.json(
        {
          data: substack,
        },
        201,
      );
    },
  );
