# Dashboard

TanStack Start frontend for Solvit. It provides the browser UI and a small
server-side auth proxy that keeps gateway tokens in HTTP-only cookies.

## Responsibilities

- Render the Solvit dashboard shell, feed, substack, question, and auth screens.
- Provide sign-in and sign-up forms.
- Proxy auth requests to the API Gateway from server routes.
- Store `solvit_authToken` and `solvit_refreshToken` as HTTP-only cookies.
- Expose Better Auth-compatible routes for the local auth client.

## Runtime

- Framework: TanStack Start, TanStack Router, Vite, React 19
- Styling: Tailwind CSS, Radix UI primitives, lucide icons
- Default port: `4000`
- Gateway dependency: `API_GATEWAY_URL`, default `http://localhost:3000`

## Server Route Surface

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/auth/$` | Better Auth handler |
| `POST` | `/api/auth/$` | Better Auth handler |
| `POST` | `/api/portal/auth/sign-in` | Proxy to Gateway `/v1/auth/sign-in` |
| `POST` | `/api/portal/auth/sign-up` | Proxy to Gateway `/v1/auth/sign-up` |
| `GET` | `/api/portal/auth/profile` | Proxy to Gateway `/v1/auth/profile` |
| `POST` | `/api/portal/auth/sign-out` | Expire local auth cookies |

The complete generated API inventory is in `../../API_REPORT.md`.

## Local Commands

```sh
pnpm --filter dashboard dev
pnpm --filter dashboard build
pnpm --filter dashboard preview
pnpm --filter dashboard test
```

Run the gateway and its upstreams before using authenticated flows:

```sh
pnpm --filter auth dev
pnpm --filter notifications dev
pnpm --filter api-gateway dev
pnpm --filter dashboard dev
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_GATEWAY_URL` | `http://localhost:3000` | Gateway base URL for server proxy calls |
| `BETTER_AUTH_URL` | `http://localhost:4000` | Better Auth local base URL |
| `BETTER_AUTH_SECRET` | development fallback | Better Auth signing secret |

## Architecture Notes

- Dashboard does not call Auth directly; its server routes call API Gateway.
- Better Auth is used as the browser/client integration surface, while the
  actual credentials and tokens come from the Solvit Auth service.
- The current UI is a product dashboard shell with mock domain views plus real
  auth integration points.
