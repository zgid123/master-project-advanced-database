/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { signOutAuthResponse } from '#/features/auth/api';

export const Route = createFileRoute('/api/portal/auth/sign-out')({
  server: {
    handlers: {
      POST: () => signOutAuthResponse(),
    },
  },
});
