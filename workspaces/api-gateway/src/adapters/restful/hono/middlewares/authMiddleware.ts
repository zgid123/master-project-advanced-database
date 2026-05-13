import type { TUserProfile } from '@domain/auth';
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import type { StatusCode } from 'hono/utils/http-status';

import { AUTH_TOKEN_COOKIE_NAME } from '../../constants';
import type { IApiGatewayContextVariables } from '../../context';

interface IProfileResponse {
  data?: TUserProfile;
}

const PUBLIC_ROUTES = new Set([
  '/health',
  '/v1/auth/sign-in',
  '/v1/auth/sign-up',
  '/v1/auth/refresh',
]);

const SUBSTACK_DETAIL_PATTERN = /^\/v1\/substacks\/[^/]+$/;

function getAuthToken(c: Context): string {
  const authorization = c.req.header('authorization') ?? '';
  const [scheme, token] = authorization.split(' ');

  if (scheme?.toLowerCase() === 'bearer' && token) {
    return token;
  }

  return getCookie(c, AUTH_TOKEN_COOKIE_NAME) ?? '';
}

function isPublicRoute(c: Context): boolean {
  const { pathname } = new URL(c.req.url);

  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }

  if (pathname === '/v1/substacks/owned') {
    return false;
  }

  if (c.req.method !== 'GET') {
    return false;
  }

  if (pathname === '/v1/substacks' || pathname === '/v1/substacks/total') {
    return true;
  }

  return SUBSTACK_DETAIL_PATTERN.test(pathname);
}

export const authMiddleware: MiddlewareHandler<
  IApiGatewayContextVariables
> = async (c, next) => {
  const isPublic = isPublicRoute(c);
  const authToken = getAuthToken(c);

  if (authToken) {
    const response = await c.var.authService.profile({
      authToken,
    });

    if (response.ok) {
      const profile = (await response.json()) as IProfileResponse;

      if (profile.data) {
        c.set('authToken', authToken);
        c.set('currentUser', profile.data);
      }
    } else if (!isPublic) {
      const body = await response.text();

      return c.newResponse(body, {
        headers: response.headers,
        statusText: response.statusText,
        status: response.status as StatusCode,
      });
    }
  }

  if (!isPublic && !c.get('currentUser')) {
    return c.json(
      {
        message: 'Unauthorized',
      },
      401,
    );
  }

  await next();
};
