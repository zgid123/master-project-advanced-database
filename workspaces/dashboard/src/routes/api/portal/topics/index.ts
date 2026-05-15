/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { proxyGatewayRequest } from '#/features/services/api';

export const Route = createFileRoute('/api/portal/topics/')({
  server: {
    handlers: {
      GET: ({ request }) =>
        proxyGatewayRequest(request, '/v1/topics/search', request.method, {
          injectCurrentUserId: true,
        }),
      POST: ({ request }) =>
        proxyGatewayRequest(request, '/v1/topics', request.method, {
          injectCurrentUserId: true,
        }),
    },
  },
});
