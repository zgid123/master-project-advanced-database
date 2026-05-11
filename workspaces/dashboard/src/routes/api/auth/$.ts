/** biome-ignore-all lint/style/useNamingConvention: tanstack start api */
import { createFileRoute } from '@tanstack/react-router';

import { proxyAuthPayload } from '#/features/auth/api/authProxy';

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const path = url.pathname.replace(/\/$/, '').replace('/api/auth', '');

        const body = await request.json().catch(() => ({}));

        let gatewayPath:
          | '/v1/auth/sign-in'
          | '/v1/auth/sign-up'
          | '/v1/auth/sign-out'
          | undefined;
        if (path === '/sign-in') gatewayPath = '/v1/auth/sign-in';
        if (path === '/sign-up') gatewayPath = '/v1/auth/sign-up';
        if (path === '/sign-out') gatewayPath = '/v1/auth/sign-out';

        if (!gatewayPath) {
          return new Response('Not Found', { status: 404 });
        }

        return proxyAuthPayload(body, request, gatewayPath);
      },
    },
  },
});
