/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { proxyJobServiceRequest } from '#/features/services/api';

export const Route = createFileRoute('/api/services/me/applications')({
  server: {
    handlers: {
      GET: ({ request }) =>
        proxyJobServiceRequest(request, '/v1/me/applications'),
    },
  },
});
