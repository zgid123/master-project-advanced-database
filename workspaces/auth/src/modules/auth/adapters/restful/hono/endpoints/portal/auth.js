import { arkValidator } from '@alphacifer/hono/core';
import { SignIn, SignUp, Token } from '@domain/auth';
import { Hono } from 'hono';
import { getUserDisplayName } from '#/utils/userUtils';
import { AuthError } from '../../../../../domain/errors';
import { authenticatedUserMiddleware, requiredUserMiddleware, } from '../../middlewares/authMiddleware';
export const authEndpoints = new Hono()
    .post('/sign-up', arkValidator('json', SignUp), async (c) => {
    const { req, var: v } = c;
    const data = req.valid('json');
    const user = await v.auth.portal.signUpCommand.exec(data);
    const { authToken, refreshToken } = await v.auth.portal.signUserCommand.exec({
        user,
    });
    v.auth.portal.notificationService
        .createSignUpWelcomeNotification({
        userId: user.id,
        email: user.email,
    })
        .catch((error) => {
        console.error('Failed to create sign-up welcome notification', error);
    });
    return c.json({
        data: {
            authToken,
            refreshToken,
            user: user.toProfile(),
        },
    });
})
    .post('/sign-in', arkValidator('json', SignIn), async (c) => {
    const { req, var: v } = c;
    const data = req.valid('json');
    const user = await v.auth.portal.signInCommand.exec(data);
    if (!user) {
        throw AuthError.invalidCredentials();
    }
    const { authToken, refreshToken } = await v.auth.portal.signUserCommand.exec({
        user,
    });
    return c.json({
        data: {
            authToken,
            refreshToken,
            user: user.toProfile(),
        },
    });
})
    .post('/refresh', arkValidator('json', Token), async (c) => {
    const { req, var: v } = c;
    const { token = '' } = req.valid('json');
    const user = await v.auth.portal.refreshTokenCommand.exec({
        refreshToken: token,
    });
    if (!user) {
        throw AuthError.tokenExpired();
    }
    const { authToken, refreshToken } = await v.auth.portal.signUserCommand.exec({
        user,
    });
    return c.json({
        data: {
            authToken,
            refreshToken,
            user: user.toProfile(),
        },
    });
})
    .post('/sign-out', async (c) => {
    const { req, var: v } = c;
    const { token = '' } = await req.json();
    await v.auth.portal.signOutCommand.exec({
        refreshToken: token,
    });
    return c.json({
        data: null,
    });
})
    .get('/profile', authenticatedUserMiddleware, requiredUserMiddleware, async (c) => {
    const currentUser = c.get('currentUser');
    return c.json({
        data: currentUser.toProfile(),
    });
})
    .post('/users/:userId/subscribe', authenticatedUserMiddleware, requiredUserMiddleware, async (c) => {
    const currentUser = c.get('currentUser');
    const { created, user } = await c.var.auth.portal.subscribeUserCommand.exec({
        userId: c.req.param('userId'),
        followerId: currentUser.id,
    });
    if (created) {
        c.var.auth.portal.notificationService
            .createSocialUserSubscribedNotification({
            userId: user.id,
            actorUserId: currentUser.id,
            actorName: getUserDisplayName(currentUser),
        })
            .catch((error) => {
            console.error('Failed to create social user subscribed notification', error);
        });
    }
    return c.body(null, 204);
})
    .delete('/users/:userId/subscribe', authenticatedUserMiddleware, requiredUserMiddleware, async (c) => {
    const currentUser = c.get('currentUser');
    await c.var.auth.portal.unsubscribeUserCommand.exec({
        userId: c.req.param('userId'),
        followerId: currentUser.id,
    });
    return c.body(null, 204);
});
