/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import {
  createUpstreamPath,
  proxyJobServiceRequest,
} from '#/features/services/api';

const DASHBOARD_PREFIX = '/api/services/jobs';
const UPSTREAM_PREFIX = '/v1/jobs';

function proxyJobRoute(request: Request): Promise<Response> {
  return proxyJobServiceRequest(
    request,
    createUpstreamPath(request, DASHBOARD_PREFIX, UPSTREAM_PREFIX),
  );
}

export const Route = createFileRoute('/api/services/jobs/$')({
  server: {
    handlers: {
      DELETE: ({ request }) => proxyJobRoute(request),
      GET: ({ request }) => proxyJobRoute(request),
      PATCH: ({ request }) => proxyJobRoute(request),
      POST: ({ request }) => proxyJobRoute(request),
    },
  },
});
