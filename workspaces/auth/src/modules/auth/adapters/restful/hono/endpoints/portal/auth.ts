import { arkValidator } from '@alphacifer/hono/core';
import { SignIn, SignUp, Token } from '@domain/auth';
import { Hono, type ValidationTargets } from 'hono';

import { AuthError } from '../../../../../domain/errors';
import {
  AUTH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../../../constants';
import type { IAuthContextVariables } from '../../../context';
import {
  authenticatedUserMiddleware,
  requiredUserMiddleware,
} from '../../middlewares/authMiddleware';
import { setHttpOnly } from '../../utils/cookieUtils';

export const authEndpoints = new Hono<IAuthContextVariables>()
  .post(
    '/sign-up',
    arkValidator<
      typeof SignUp,
      keyof ValidationTargets,
      IAuthContextVariables,
      string
    >('json', SignUp),
    async (c) => {
      const { req, var: v } = c;
      const data = req.valid('json');

      const user = await v.auth.portal.signUpCommand.exec(data);

      const { authToken, refreshToken } =
        await v.auth.portal.signUserCommand.exec({
          user,
        });

      setHttpOnly(c, AUTH_TOKEN_COOKIE_NAME, authToken, {
        expires: '1h',
      });
      setHttpOnly(c, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        expires: '1y',
      });

      return c.json({
        data: {
          authToken,
          refreshToken,
          user: user.toProfile(),
        },
      });
    },
  )
  .post(
    '/sign-in',
    arkValidator<
      typeof SignIn,
      keyof ValidationTargets,
      IAuthContextVariables,
      string
    >('json', SignIn),
    async (c) => {
      const { req, var: v } = c;
      const data = req.valid('json');

      const user = await v.auth.portal.signInCommand.exec(data);

      if (!user) {
        throw AuthError.invalidCredentials();
      }

      const { authToken, refreshToken } =
        await v.auth.portal.signUserCommand.exec({
          user,
        });

      setHttpOnly(c, AUTH_TOKEN_COOKIE_NAME, authToken, {
        expires: '1h',
      });
      setHttpOnly(c, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        expires: '1y',
      });

      return c.json({
        data: {
          authToken,
          refreshToken,
          user: user.toProfile(),
        },
      });
    },
  )
  .post(
    '/refresh',
    arkValidator<
      typeof Token,
      keyof ValidationTargets,
      IAuthContextVariables,
      string
    >('json', Token),
    async (c) => {
      const { req, var: v } = c;
      const { token = '' } = req.valid('json');

      const user = await v.auth.portal.refreshTokenCommand.exec({
        refreshToken: token,
      });

      if (!user) {
        throw AuthError.tokenExpired();
      }

      const { authToken, refreshToken } =
        await v.auth.portal.signUserCommand.exec({
          user,
        });

      setHttpOnly(c, AUTH_TOKEN_COOKIE_NAME, authToken, {
        expires: '1h',
      });
      setHttpOnly(c, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        expires: '1y',
      });

      return c.json({
        data: {
          authToken,
          refreshToken,
          user: user.toProfile(),
        },
      });
    },
  )
  .get(
    '/profile',
    authenticatedUserMiddleware,
    requiredUserMiddleware,
    async (c) => {
      const currentUser = c.get('currentUser');

      return c.json({
        data: currentUser.toProfile(),
      });
    },
  );
