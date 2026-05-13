const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';
const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL ?? 'http://localhost:3010';
const RECSYS_SERVICE_URL =
  process.env.RECSYS_SERVICE_URL ?? 'http://localhost:3020';
const AUTH_TOKEN_COOKIE_NAME = 'solvit_authToken';

type TProxyHttpOptions = {
  authFromCookie?: boolean;
  forwardAuthorization?: boolean;
  forwardCookie?: boolean;
  injectCurrentUserId?: boolean;
  method?: string;
};

export function createUpstreamPath(
  request: Request,
  dashboardPrefix: string,
  upstreamPrefix: string,
): string {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, '');
  const normalizedPrefix = dashboardPrefix.replace(/\/+$/, '');
  const suffix =
    pathname === normalizedPrefix ? '' : pathname.slice(normalizedPrefix.length);

  return `${upstreamPrefix}${suffix}`;
}

export function proxyGatewayRequest(
  request: Request,
  path: string,
  method = request.method,
): Promise<Response> {
  return proxyHttpRequest(request, API_GATEWAY_URL, path, {
    forwardAuthorization: true,
    forwardCookie: true,
    method,
  });
}

export function proxyJobServiceRequest(
  request: Request,
  path: string,
  method = request.method,
): Promise<Response> {
  return proxyHttpRequest(request, JOB_SERVICE_URL, path, {
    authFromCookie: true,
    forwardAuthorization: true,
    method,
  });
}

export function proxyRecommendationRequest(
  request: Request,
  path: string,
  {
    injectCurrentUserId = false,
    method = request.method,
  }: {
    injectCurrentUserId?: boolean;
    method?: string;
  } = {},
): Promise<Response> {
  return proxyHttpRequest(request, RECSYS_SERVICE_URL, path, {
    injectCurrentUserId,
    method,
  });
}

async function proxyHttpRequest(
  request: Request,
  baseUrl: string,
  path: string,
  options: TProxyHttpOptions = {},
): Promise<Response> {
  const method = options.method ?? request.method;
  const upstreamUrl = new URL(path, baseUrl);
  upstreamUrl.search = new URL(request.url).search;

  const isPayloadMethod = method !== 'GET' && method !== 'HEAD';
  const body = isPayloadMethod ? await request.text() : undefined;
  const headers = await createUpstreamHeaders(request, options);

  if (isPayloadMethod) {
    headers.set(
      'content-type',
      request.headers.get('content-type') ?? 'application/json',
    );
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    body,
    headers,
    method,
  });

  return createProxyResponse(upstreamResponse);
}

async function createUpstreamHeaders(
  request: Request,
  options: TProxyHttpOptions,
): Promise<Headers> {
  const headers = new Headers();
  const accept = request.headers.get('accept');
  const cookie = request.headers.get('cookie') ?? '';

  if (accept) {
    headers.set('accept', accept);
  }

  if (options.forwardCookie && cookie) {
    headers.set('cookie', cookie);
  }

  if (options.forwardAuthorization || options.authFromCookie) {
    const authorization = createAuthorizationHeader(
      request.headers.get('authorization'),
      options.authFromCookie ? getCookieValue(cookie, AUTH_TOKEN_COOKIE_NAME) : '',
    );

    if (authorization) {
      headers.set('authorization', authorization);
    }
  }

  if (options.injectCurrentUserId) {
    const userId =
      request.headers.get('x-user-id') || (await getCurrentUserId(request));

    if (userId) {
      headers.set('x-user-id', userId);
    }
  }

  return headers;
}

function createAuthorizationHeader(
  authorizationHeader: string | null,
  cookieToken: string,
): string {
  if (authorizationHeader) {
    return authorizationHeader;
  }

  if (!cookieToken) {
    return '';
  }

  return `Bearer ${cookieToken}`;
}

async function getCurrentUserId(request: Request): Promise<string> {
  const headers = new Headers();
  const cookie = request.headers.get('cookie') ?? '';
  const authorization = request.headers.get('authorization');

  if (cookie) {
    headers.set('cookie', cookie);
  }

  if (authorization) {
    headers.set('authorization', authorization);
  }

  const response = await fetch(new URL('/v1/auth/profile', API_GATEWAY_URL), {
    headers,
    method: 'GET',
  });

  if (!response.ok) {
    return '';
  }

  const payload = (await response.json().catch(() => ({}))) as {
    data?: { id?: unknown };
  };

  return typeof payload.data?.id === 'string' ? payload.data.id : '';
}

function createProxyResponse(response: Response): Promise<Response> {
  return response.text().then((body) => {
    const headers = new Headers();

    response.headers.forEach((value, key) => {
      if (shouldForwardResponseHeader(key)) {
        headers.set(key, value);
      }
    });

    return new Response(body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  });
}

function shouldForwardResponseHeader(key: string): boolean {
  return !['content-encoding', 'content-length', 'transfer-encoding'].includes(
    key.toLowerCase(),
  );
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
