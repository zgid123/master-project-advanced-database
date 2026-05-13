/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { createUpstreamPath, proxyGatewayRequest } from '#/features/services/api';

const DASHBOARD_PREFIX = '/api/portal/topics';
const UPSTREAM_PREFIX = '/v1/topics';

function proxyTopicRoute(request: Request): Promise<Response> {
  return proxyGatewayRequest(
    request,
    createUpstreamPath(request, DASHBOARD_PREFIX, UPSTREAM_PREFIX),
  );
}

export const Route = createFileRoute('/api/portal/topics/$')({
  server: {
    handlers: {
      DELETE: ({ request }) => proxyTopicRoute(request),
      GET: ({ request }) => proxyTopicRoute(request),
      PATCH: ({ request }) => proxyTopicRoute(request),
      POST: ({ request }) => proxyTopicRoute(request),
    },
  },
});
