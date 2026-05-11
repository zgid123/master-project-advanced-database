const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';
const AUTH_TOKEN_COOKIE_NAME = 'solvit_authToken';
const REFRESH_TOKEN_COOKIE_NAME = 'solvit_refreshToken';

type TAuthServiceResponse = {
  data?: {
    authToken?: unknown;
    refreshToken?: unknown;
  };
};

function createAuthCookie(name: string, value: string, maxAge: number) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function appendAuthCookies(headers: Headers, body: string): void {
  let parsed: TAuthServiceResponse;

  try {
    parsed = JSON.parse(body) as TAuthServiceResponse;
  } catch {
    return;
  }

  const { authToken, refreshToken } = parsed.data ?? {};

  if (typeof authToken === 'string') {
    headers.append(
      'set-cookie',
      createAuthCookie(AUTH_TOKEN_COOKIE_NAME, authToken, 60 * 60),
    );
  }

  if (typeof refreshToken === 'string') {
    headers.append(
      'set-cookie',
      createAuthCookie(
        REFRESH_TOKEN_COOKIE_NAME,
        refreshToken,
        60 * 60 * 24 * 365,
      ),
    );
  }
}

export async function proxyAuthRequest(
  request: Request,
  path: '/v1/auth/sign-in' | '/v1/auth/sign-up',
): Promise<Response> {
  return proxyAuthBody(await request.text(), request.headers, path);
}

export async function proxyAuthPayload(
  payload: unknown,
  request: Request,
  path: '/v1/auth/sign-in' | '/v1/auth/sign-up',
): Promise<Response> {
  return proxyAuthBody(JSON.stringify(payload), request.headers, path);
}

async function proxyAuthBody(
  body: string,
  headers: Headers,
  path: '/v1/auth/sign-in' | '/v1/auth/sign-up',
): Promise<Response> {
  const upstreamResponse = await fetch(new URL(path, API_GATEWAY_URL), {
    body,
    method: 'POST',
    headers: {
      'content-type': headers.get('content-type') ?? 'application/json',
      cookie: headers.get('cookie') ?? '',
    },
  });

  const responseBody = await upstreamResponse.text();
  const responseHeaders = new Headers({
    'content-type':
      upstreamResponse.headers.get('content-type') ?? 'application/json',
  });

  if (upstreamResponse.ok) {
    appendAuthCookies(responseHeaders, responseBody);
  }

  return new Response(responseBody, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export async function proxyAuthProfileRequest(
  request: Request,
): Promise<Response> {
  const upstreamResponse = await fetch(
    new URL('/v1/auth/profile', API_GATEWAY_URL),
    {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') ?? '',
        authorization: request.headers.get('authorization') ?? '',
      },
    },
  );

  const body = await upstreamResponse.text();
  const headers = new Headers({
    'content-type':
      upstreamResponse.headers.get('content-type') ?? 'application/json',
  });

  return new Response(body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}

function expireAuthCookie(name: string) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function signOutAuthResponse(): Response {
  const headers = new Headers({
    'content-type': 'application/json',
  });

  headers.append('set-cookie', expireAuthCookie(AUTH_TOKEN_COOKIE_NAME));
  headers.append('set-cookie', expireAuthCookie(REFRESH_TOKEN_COOKIE_NAME));

  return new Response(JSON.stringify({ data: null }), {
    status: 200,
    headers,
  });
}
