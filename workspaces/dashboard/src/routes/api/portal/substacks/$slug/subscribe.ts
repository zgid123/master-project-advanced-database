/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { proxySubstackRequest } from '#/features/substack/api';

export const Route = createFileRoute('/api/portal/substacks/$slug/subscribe')({
  server: {
    handlers: {
      DELETE: ({ request, params }) => {
        return proxySubstackRequest(
          request,
          `/v1/substacks/${encodeURIComponent(params.slug)}/subscribe`,
        );
      },
      POST: ({ request, params }) => {
        return proxySubstackRequest(
          request,
          `/v1/substacks/${encodeURIComponent(params.slug)}/subscribe`,
        );
      },
    },
  },
});
