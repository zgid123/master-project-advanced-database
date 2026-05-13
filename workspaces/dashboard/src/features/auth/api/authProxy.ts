const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';

export async function proxyAuthPayload(
  payload: unknown,
  request: Request,
  path:
    | '/v1/auth/sign-in'
    | '/v1/auth/sign-up'
    | '/v1/auth/sign-out'
    | '/v1/auth/refresh',
): Promise<Response> {
  return fetch(new URL(path, API_GATEWAY_URL), {
    body: JSON.stringify(payload),
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
