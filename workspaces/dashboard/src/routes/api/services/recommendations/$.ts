/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import {
  createUpstreamPath,
  proxyRecommendationRequest,
} from '#/features/services/api';

const DASHBOARD_PREFIX = '/api/services/recommendations';
const UPSTREAM_PREFIX = '/v1';

export const Route = createFileRoute('/api/services/recommendations/$')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const path = createUpstreamPath(
          request,
          DASHBOARD_PREFIX,
          UPSTREAM_PREFIX,
        );

        return proxyRecommendationRequest(request, path, {
          injectCurrentUserId: path === '/v1/feed',
        });
      },
    },
  },
});
