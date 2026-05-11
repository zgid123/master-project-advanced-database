import { arkValidator } from '@alphacifer/hono/core';
import { CreateSubstack } from '@domain/auth';
import { parsePagy } from '@node/utils';
import { Hono, type ValidationTargets } from 'hono';

import {
  authenticatedUserMiddleware,
  requiredUserMiddleware,
} from '#/modules/auth/adapters/restful/hono/middlewares/authMiddleware';
import { getUserDisplayName } from '#/utils/userUtils';

import type { ISubstackContextVariables } from '../../../context';

const CreateSubstackRequest = CreateSubstack.omit('ownerId');
const MAX_SUBSTACK_LIMIT = 50;

export const substackEndpoints = new Hono<ISubstackContextVariables>()
  .use(authenticatedUserMiddleware)
  .get('/', async (c) => {
    const { limit } = c.req.query();
    const pagy = limit ? parsePagy({ limit }) : undefined;

    const substacks = await c.var.substack.portal.getSubstacksQuery.exec({
      limit: pagy ? Math.min(pagy.limit, MAX_SUBSTACK_LIMIT) : undefined,
    });

    return c.json({
      data: substacks,
    });
  })
  .get('/total', async (c) => {
    const totalSubstacks =
      await c.var.substack.portal.getTotalSubstacksQuery.exec();

    return c.json({
      data: {
        totalSubstacks,
      },
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
  .use(requiredUserMiddleware)
  .post('/:slug/subscribe', async (c) => {
    const currentUser = c.get('currentUser');
    const { created, substack } =
      await c.var.substack.portal.subscribeSubstackCommand.exec({
        userId: currentUser.id,
        slug: c.req.param('slug'),
      });

    if (created && substack.ownerId !== currentUser.id) {
      c.var.auth.portal.notificationService
        .createSubstackSubscribedNotification({
          substackId: substack.id,
          userId: substack.ownerId,
          actorUserId: currentUser.id,
          substackName: substack.name,
          substackSlug: substack.slug,
          actorName: getUserDisplayName(currentUser),
        })
        .catch((error: unknown) => {
          console.error(
            'Failed to create substack subscribed notification',
            error,
          );
        });
    }

    return c.body(null, 204);
  })
  .delete('/:slug/subscribe', async (c) => {
    const currentUser = c.get('currentUser');

    await c.var.substack.portal.unsubscribeSubstackCommand.exec({
      userId: currentUser.id,
      slug: c.req.param('slug'),
    });

    return c.body(null, 204);
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
