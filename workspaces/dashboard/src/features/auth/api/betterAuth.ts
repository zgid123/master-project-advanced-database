import { type BetterAuthPlugin, betterAuth } from 'better-auth';
import { createAuthEndpoint } from 'better-auth/api';

import { proxyAuthPayload } from './authProxy';

const betterAuthUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4000';

function proxyGatewayAuthRequest(
  request: Request | undefined,
  payload: unknown,
  path: '/v1/auth/sign-in' | '/v1/auth/sign-up',
) {
  if (!request) {
    return new Response(
      JSON.stringify({
        message: 'Authentication request is missing.',
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      },
    );
  }

  return proxyAuthPayload(payload, request, path);
}

const apiGatewayAuthPlugin = {
  id: 'api-gateway-auth',
  endpoints: {
    portalSignIn: createAuthEndpoint(
      '/portal/sign-in',
      {
        method: 'POST',
      },
      async (ctx) =>
        proxyGatewayAuthRequest(ctx.request, ctx.body, '/v1/auth/sign-in'),
    ),
    portalSignUp: createAuthEndpoint(
      '/portal/sign-up',
      {
        method: 'POST',
      },
      async (ctx) =>
        proxyGatewayAuthRequest(ctx.request, ctx.body, '/v1/auth/sign-up'),
    ),
  },
} satisfies BetterAuthPlugin;

export const auth = betterAuth({
  baseURL: betterAuthUrl,
  basePath: '/api/auth',
  plugins: [apiGatewayAuthPlugin],
  secret:
    process.env.BETTER_AUTH_SECRET ??
    'dashboard-development-better-auth-secret-change-me',
  emailAndPassword: {
    enabled: true,
  },
});
