/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { proxyRecommendationRequest } from '#/features/services/api';

export const Route = createFileRoute('/api/services/recommendations/')({
  server: {
    handlers: {
      GET: ({ request }) =>
        proxyRecommendationRequest(request, '/v1/trending'),
    },
  },
});
