import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

interface IForwardUpstreamResponseOptions {
  excludedHeaders?: string[];
}

const DEFAULT_EXCLUDED_HEADERS = [
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

export function createUpstreamResponseHeaders(
  response: Response,
  { excludedHeaders = [] }: IForwardUpstreamResponseOptions = {},
): Headers {
  const headers = new Headers(response.headers);

  for (const header of [...DEFAULT_EXCLUDED_HEADERS, ...excludedHeaders]) {
    headers.delete(header);
  }

  return headers;
}

export async function forwardUpstreamResponse(
  c: Context,
  response: Response,
  options: IForwardUpstreamResponseOptions = {},
): Promise<Response> {
  const body = await response.text();

  return c.newResponse(body, {
    statusText: response.statusText,
    status: response.status as StatusCode,
    headers: createUpstreamResponseHeaders(response, options),
  });
}
