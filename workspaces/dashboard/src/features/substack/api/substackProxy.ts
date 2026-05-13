const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';

type TSubstackProxyPath =
  | '/v1/substacks'
  | '/v1/substacks/owned'
  | '/v1/substacks/total'
  | `/v1/substacks/${string}`
  | `/v1/substacks/${string}/subscribe`;

export async function proxySubstackRequest(
  request: Request,
  path: TSubstackProxyPath,
  method = request.method,
): Promise<Response> {
  const upstreamUrl = new URL(path, API_GATEWAY_URL);
  upstreamUrl.search = new URL(request.url).search;
  const isPayloadMethod = method !== 'GET' && method !== 'HEAD';
  const requestBody = isPayloadMethod ? await request.text() : undefined;
  const requestHeaders: Record<string, string> = {
    cookie: request.headers.get('cookie') ?? '',
    authorization: request.headers.get('authorization') ?? '',
  };

  if (isPayloadMethod) {
    requestHeaders['content-type'] =
      request.headers.get('content-type') ?? 'application/json';
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    body: requestBody,
    method,
    headers: requestHeaders,
  });

  const responseBody = await upstreamResponse.text();
  const responseHeaders = new Headers({
    'content-type':
      upstreamResponse.headers.get('content-type') ?? 'application/json',
  });

  return new Response(responseBody, {
    headers: responseHeaders,
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
}
