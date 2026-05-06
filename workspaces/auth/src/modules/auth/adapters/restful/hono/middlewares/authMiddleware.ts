import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

import { extractJWT } from '#/infrastructure/security/jwt';

import { AuthError } from '../../../../domain/errors';
import { AUTH_TOKEN_COOKIE_NAME } from '../../constants';
import type { IAuthContextVariables } from '../../context';
import { extractBearerToken } from '../utils/headerUtils';

export const authenticatedUserMiddleware =
  createMiddleware<IAuthContextVariables>(async (c, next) => {
    const { req, var: v } = c;
    const header = req.header('Authorization');
    const token =
      extractBearerToken(header) ||
      getCookie(c, AUTH_TOKEN_COOKIE_NAME) ||
      c.get(AUTH_TOKEN_COOKIE_NAME) ||
      '';

    try {
      const payload = extractJWT<Record<string, string>>({
        token,
      });

      if (!payload.sub) {
        return next();
      }

      const user = await v.auth.portal.getUserQuery.exec({
        email: payload.sub,
      });

      c.set('currentUser', user);
    } catch {}

    return next();
  });

export const requiredUserMiddleware = createMiddleware<IAuthContextVariables>(
  async (c, next) => {
    const user = c.get('currentUser');

    if (!user) {
      throw AuthError.unauthorized();
    }

    return next();
  },
);

export const requiredAdminUserMiddlware =
  createMiddleware<IAuthContextVariables>(async (c, next) => {
    const user = c.get('currentUser');

    if (!user.isAdmin()) {
      throw AuthError.unauthorized();
    }

    return next();
  });
