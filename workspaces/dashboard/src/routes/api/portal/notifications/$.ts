/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { createUpstreamPath, proxyGatewayRequest } from '#/features/services/api';

const DASHBOARD_PREFIX = '/api/portal/notifications';
const UPSTREAM_PREFIX = '/v1/notifications';

export const Route = createFileRoute('/api/portal/notifications/$')({
  server: {
    handlers: {
      PATCH: ({ request }) => {
        return proxyGatewayRequest(
          request,
          createUpstreamPath(request, DASHBOARD_PREFIX, UPSTREAM_PREFIX),
        );
      },
    },
  },
});
