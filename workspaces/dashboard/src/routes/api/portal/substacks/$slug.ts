/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { proxySubstackRequest } from '#/features/substack/api';

export const Route = createFileRoute('/api/portal/substacks/$slug')({
  server: {
    handlers: {
      GET: ({ request, params }) => {
        return proxySubstackRequest(
          request,
          `/v1/substacks/${encodeURIComponent(params.slug)}`,
        );
      },
      PUT: ({ request, params }) => {
        return proxySubstackRequest(
          request,
          `/v1/substacks/${encodeURIComponent(params.slug)}`,
        );
      },
      DELETE: ({ request, params }) => {
        return proxySubstackRequest(
          request,
          `/v1/substacks/${encodeURIComponent(params.slug)}`,
        );
      },
    },
  },
});
