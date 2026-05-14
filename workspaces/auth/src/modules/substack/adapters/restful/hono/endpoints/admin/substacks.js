import { Hono } from 'hono';
import { authenticatedUserMiddleware, requiredAdminUserMiddlware, requiredUserMiddleware, } from '#/modules/auth/adapters/restful/hono/middlewares/authMiddleware';
export const adminSubstackEndpoints = new Hono()
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
