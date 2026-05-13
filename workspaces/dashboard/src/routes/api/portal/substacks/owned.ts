/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { proxySubstackRequest } from '#/features/substack/api';

export const Route = createFileRoute('/api/portal/substacks/owned')({
  server: {
    handlers: {
      GET: ({ request }) => proxySubstackRequest(request, '/v1/substacks/owned'),
    },
  },
});
