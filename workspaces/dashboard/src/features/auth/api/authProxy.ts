const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';
const REFRESH_TOKEN_COOKIE_NAME = 'solvit_refreshToken';

export async function proxyAuthPayload(
  payload: unknown,
  request: Request,
  path:
    | '/v1/auth/refresh'
    | '/v1/auth/sign-in'
    | '/v1/auth/sign-out'
    | '/v1/auth/sign-up',
): Promise<Response> {
  return fetch(new URL(path, API_GATEWAY_URL), {
    body: JSON.stringify(createAuthPayload(payload, request, path)),
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: request.headers.get('cookie') ?? '',
    },
  });
}

export async function proxyAuthProfileRequest(
  request: Request,
): Promise<Response> {
  return fetch(new URL('/v1/auth/profile', API_GATEWAY_URL), {
    method: 'GET',
    headers: {
      cookie: request.headers.get('cookie') ?? '',
      authorization: request.headers.get('authorization') ?? '',
    },
  });
}

function createAuthPayload(
  payload: unknown,
  request: Request,
  path: string,
): unknown {
  if (path !== '/v1/auth/refresh' || !isRecord(payload) || payload.token) {
    return payload;
  }

  return {
    ...payload,
    token: getCookieValue(
      request.headers.get('cookie') ?? '',
      REFRESH_TOKEN_COOKIE_NAME,
    ),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getCookieValue(cookieHeader: string, name: string): string {
  const prefix = `${name}=`;
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookie) {
    return '';
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}
