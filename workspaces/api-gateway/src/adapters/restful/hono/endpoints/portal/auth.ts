import { type Context, Hono } from 'hono';
import { deleteCookie, getCookie } from 'hono/cookie';
import type { StatusCode } from 'hono/utils/http-status';

import {
  AUTH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../../../constants';
import type { IApiGatewayContextVariables } from '../../../context';
import { setHttpOnly } from '../../utils/cookieUtils';
import {
  createUpstreamResponseHeaders,
  forwardUpstreamResponse,
} from '../../utils/upstreamResponseUtils';

interface IAuthServiceResponse {
  data?: {
    authToken?: unknown;
    refreshToken?: unknown;
  };
}

function setAuthCookies(c: Context, body: string): void {
  let parsed: IAuthServiceResponse;

  try {
    parsed = JSON.parse(body) as IAuthServiceResponse;
  } catch {
    return;
  }

  const { authToken, refreshToken } = parsed.data ?? {};

  if (typeof authToken === 'string') {
    setHttpOnly(c, AUTH_TOKEN_COOKIE_NAME, authToken, {
      expires: '1h',
    });
  }

  if (typeof refreshToken === 'string') {
    setHttpOnly(c, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      expires: '1y',
    });
  }
}

function deleteAuthCookies(c: Context): void {
  deleteCookie(c, AUTH_TOKEN_COOKIE_NAME);
  deleteCookie(c, REFRESH_TOKEN_COOKIE_NAME);
}

export const authEndpoints = new Hono<IApiGatewayContextVariables>()
  .post('/sign-up', async (c) => {
    const { req, var: v } = c;

    const response = await v.authService.signUp({
      body: await req.text(),
      contentType: req.header('content-type'),
    });
    const body = await response.text();

    if (response.ok) {
      setAuthCookies(c, body);
    }

    return c.newResponse(body, {
      statusText: response.statusText,
      status: response.status as StatusCode,
      headers: createUpstreamResponseHeaders(response, {
        excludedHeaders: ['set-cookie'],
      }),
    });
  })
  .post('/sign-in', async (c) => {
    const { req, var: v } = c;

    const response = await v.authService.signIn({
      body: await req.text(),
      contentType: req.header('content-type'),
    });
    const body = await response.text();

    if (response.ok) {
      setAuthCookies(c, body);
    }

    return c.newResponse(body, {
      statusText: response.statusText,
      status: response.status as StatusCode,
      headers: createUpstreamResponseHeaders(response, {
        excludedHeaders: ['set-cookie'],
      }),
    });
  })
  .post('/refresh', async (c) => {
    const { req, var: v } = c;
    const reqBody = await req.text();
    let parsed: { token?: string } = {};
    try {
      parsed = JSON.parse(reqBody);
    } catch {}

    const token = parsed.token || getCookie(c, REFRESH_TOKEN_COOKIE_NAME);

    const response = await v.authService.refresh({
      body: JSON.stringify({
        token,
      }),
      contentType: 'application/json',
    });
    const body = await response.text();

    if (response.ok) {
      setAuthCookies(c, body);
    }

    return c.newResponse(body, {
      statusText: response.statusText,
      status: response.status as StatusCode,
      headers: createUpstreamResponseHeaders(response, {
        excludedHeaders: ['set-cookie'],
      }),
    });
  })
  .post('/sign-out', async (c) => {
    const { req, var: v } = c;
    const reqBody = await req.text();
    let parsed: { token?: string } = {};
    try {
      parsed = JSON.parse(reqBody);
    } catch {}

    const token = parsed.token || getCookie(c, REFRESH_TOKEN_COOKIE_NAME);

    const response = await v.authService.signOut({
      body: JSON.stringify({
        token,
      }),
      contentType: 'application/json',
    });
    const body = await response.text();

    deleteAuthCookies(c);

    return c.newResponse(body, {
      statusText: response.statusText,
      status: response.status as StatusCode,
      headers: createUpstreamResponseHeaders(response, {
        excludedHeaders: ['set-cookie'],
      }),
    });
  })
  .get('/profile', (c) => {
    return c.json({
      data: c.get('currentUser'),
    });
  })
  .post('/users/:userId/subscribe', async (c) => {
    const response = await c.var.authService.subscribeUser({
      userId: c.req.param('userId'),
      authToken: c.get('authToken'),
    });

    return forwardUpstreamResponse(c, response, {
      excludedHeaders: ['set-cookie'],
    });
  })
  .delete('/users/:userId/subscribe', async (c) => {
    const response = await c.var.authService.unsubscribeUser({
      userId: c.req.param('userId'),
      authToken: c.get('authToken'),
    });

    return forwardUpstreamResponse(c, response, {
      excludedHeaders: ['set-cookie'],
    });
  });
