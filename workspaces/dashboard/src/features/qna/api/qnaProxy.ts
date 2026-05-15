const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';

function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const newKey = key.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase(),
        );
        newObj[newKey] = toCamelCase(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

export async function proxyQnaRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '').replace('/api/portal/qna', '');
  const upstreamUrl = new URL(`/v1${path}`, API_GATEWAY_URL);
  upstreamUrl.search = url.search;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const cookie = request.headers.get('cookie');
  const authorization = request.headers.get('authorization');
  const userId = request.headers.get('x-user-id');

  if (contentType) headers.set('content-type', contentType);
  if (cookie) headers.set('cookie', cookie);
  if (authorization) headers.set('authorization', authorization);
  if (userId) headers.set('x-user-id', userId);

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
  });

  const upstreamContentType = upstreamResponse.headers.get('content-type') ?? '';
  let responseBody: any;

  if (upstreamContentType.includes('application/json')) {
    const json = await upstreamResponse.json();
    responseBody = JSON.stringify(toCamelCase(json));
  } else {
    responseBody = await upstreamResponse.text();
  }

  const responseHeaders = new Headers({
    'content-type': upstreamContentType || 'application/json',
  });

  return new Response(responseBody, {
    headers: responseHeaders,
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
}
