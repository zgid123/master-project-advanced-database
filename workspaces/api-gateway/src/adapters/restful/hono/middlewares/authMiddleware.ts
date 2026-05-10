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
]);

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

  return PUBLIC_ROUTES.has(pathname);
}

export const authMiddleware: MiddlewareHandler<
  IApiGatewayContextVariables
> = async (c, next) => {
  if (isPublicRoute(c)) {
    await next();

    return;
  }

  const authToken = getAuthToken(c);

  if (!authToken) {
    return c.json(
      {
        message: 'Unauthorized',
      },
      401,
    );
  }

  const response = await c.var.authService.profile({
    authToken,
  });

  if (!response.ok) {
    const body = await response.text();

    return c.newResponse(body, {
      headers: response.headers,
      statusText: response.statusText,
      status: response.status as StatusCode,
    });
  }

  const profile = (await response.json()) as IProfileResponse;

  if (!profile.data) {
    return c.json(
      {
        message: 'Unauthorized',
      },
      401,
    );
  }

  c.set('authToken', authToken);
  c.set('currentUser', profile.data);

  await next();
};
