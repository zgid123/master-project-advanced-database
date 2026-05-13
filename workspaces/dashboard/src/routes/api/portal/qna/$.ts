/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { proxyQnaRequest } from '#/features/qna/api';

export const Route = createFileRoute('/api/portal/qna/$')({
  server: {
    handlers: {
      GET: ({ request }) => proxyQnaRequest(request),
      POST: ({ request }) => proxyQnaRequest(request),
      PATCH: ({ request }) => proxyQnaRequest(request),
      DELETE: ({ request }) => proxyQnaRequest(request),
    },
  },
});
