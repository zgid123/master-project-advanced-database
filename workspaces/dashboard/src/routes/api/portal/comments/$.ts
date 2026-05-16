/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { createUpstreamPath, proxyGatewayRequest } from '#/features/services/api';

const DASHBOARD_PREFIX = '/api/portal/comments';
const UPSTREAM_PREFIX = '/v1/comments';

function proxyCommentRoute(request: Request): Promise<Response> {
  return proxyGatewayRequest(
    request,
    createUpstreamPath(request, DASHBOARD_PREFIX, UPSTREAM_PREFIX),
    request.method,
    { injectCurrentUserId: true },
  );
}

export const Route = createFileRoute('/api/portal/comments/$')({
  server: {
    handlers: {
      DELETE: ({ request }) => proxyCommentRoute(request),
      GET: ({ request }) => proxyCommentRoute(request),
      PATCH: ({ request }) => proxyCommentRoute(request),
      POST: ({ request }) => proxyCommentRoute(request),
    },
  },
});
