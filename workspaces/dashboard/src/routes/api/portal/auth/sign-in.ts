/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { proxyAuthRequest } from '#/features/auth/api';

export const Route = createFileRoute('/api/portal/auth/sign-in')({
  server: {
    handlers: {
      POST: ({ request }) => proxyAuthRequest(request, '/v1/auth/sign-in'),
    },
  },
});
