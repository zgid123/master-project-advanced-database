/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import {
  createUpstreamPath,
  proxyJobServiceRequest,
} from '#/features/services/api';

const DASHBOARD_PREFIX = '/api/services/applications';
const UPSTREAM_PREFIX = '/v1/applications';

export const Route = createFileRoute('/api/services/applications/$')({
  server: {
    handlers: {
      PATCH: ({ request }) => {
        return proxyJobServiceRequest(
          request,
          createUpstreamPath(request, DASHBOARD_PREFIX, UPSTREAM_PREFIX),
        );
      },
    },
  },
});
