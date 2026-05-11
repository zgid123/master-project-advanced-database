const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';

type TSubstackProxyPath =
  | '/v1/substacks'
  | '/v1/substacks/total'
  | `/v1/substacks/${string}`;

export async function proxySubstackRequest(
  request: Request,
  path: TSubstackProxyPath,
): Promise<Response> {
  const upstreamUrl = new URL(path, API_GATEWAY_URL);
  upstreamUrl.search = new URL(request.url).search;

  const upstreamResponse = await fetch(upstreamUrl, {
    method: 'GET',
    headers: {
      cookie: request.headers.get('cookie') ?? '',
      authorization: request.headers.get('authorization') ?? '',
    },
  });

  const body = await upstreamResponse.text();
  const headers = new Headers({
    'content-type':
      upstreamResponse.headers.get('content-type') ?? 'application/json',
  });

  return new Response(body, {
    headers,
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
}
