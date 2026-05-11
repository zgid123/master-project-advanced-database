/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { proxyAuthProfileRequest } from '#/features/auth/api';

export const Route = createFileRoute('/api/portal/auth/profile')({
  server: {
    handlers: {
      GET: ({ request }) => proxyAuthProfileRequest(request),
    },
  },
});
