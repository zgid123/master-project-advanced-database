# API Gateway

Public Hono gateway for Solvit browser-facing auth, notification, and public
substack-list traffic. It is intentionally thin: it validates the current user
through Auth, forwards requests to upstream services, and normalizes auth
cookies.

## Responsibilities

- Expose public Auth proxy routes.
- Expose the Notifications portal proxy route.
- Expose public substack list and total-count proxy routes.
- Read bearer tokens or `solvit_authToken` cookies.
- Resolve the current user by calling Auth `/v1/auth/profile`.
- Set HTTP-only `solvit_authToken` and `solvit_refreshToken` cookies after
  sign-up, sign-in, and refresh.

## Runtime

- Framework: Hono on `@hono/node-server`
- Default port: `3000`
- Upstreams:
  - Auth: `AUTH_SERVICE_URL`, default `http://localhost:3001`
  - Notifications: `NOTIFICATIONS_SERVICE_URL`, default `http://localhost:3002`
  - Q&A: `QNA_SERVICE_URL`, default `http://localhost:3005`

## API Surface

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Gateway health check |
| `POST` | `/v1/auth/sign-up` | Proxies Auth sign-up and sets auth cookies |
| `POST` | `/v1/auth/sign-in` | Proxies Auth sign-in and sets auth cookies |
| `POST` | `/v1/auth/refresh` | Proxies Auth refresh and sets auth cookies |
| `GET` | `/v1/auth/profile` | Returns user resolved by gateway middleware |
| `POST` | `/v1/auth/users/:userId/subscribe` | Proxies user follow |
| `DELETE` | `/v1/auth/users/:userId/subscribe` | Proxies user unfollow |
| `GET` | `/v1/notifications` | Proxies notification list with original query string |
| `GET` | `/v1/substacks` | Public proxy to Auth substack list |
| `GET` | `/v1/substacks/total` | Public proxy to Auth approved-substack count |
| `GET` | `/v1/topics/search` | Proxies Q&A topic search |
| `POST` | `/v1/topics` | Proxies Q&A topic creation |
| `GET` | `/v1/topics/:id` | Proxies Q&A topic details |
| `PATCH` | `/v1/topics/:id` | Proxies Q&A topic update |
| `DELETE` | `/v1/topics/:id` | Proxies Q&A topic delete |
| `PATCH` | `/v1/topics/:id/solve` | Proxies Q&A topic solve |
| `GET` | `/v1/topics/:id/comments` | Proxies Q&A topic comments |
| `POST` | `/v1/topics/:id/vote` | Proxies Q&A topic vote |
| `DELETE` | `/v1/topics/:id/vote` | Proxies Q&A topic vote removal |
| `POST` | `/v1/topics/:id/subscribe` | Proxies Q&A topic subscribe |
| `POST` | `/v1/topics/:id/unsubscribe` | Proxies Q&A topic unsubscribe |
| `POST` | `/v1/comments` | Proxies Q&A comment create |
| `PATCH` | `/v1/comments/:id` | Proxies Q&A comment update |
| `DELETE` | `/v1/comments/:id` | Proxies Q&A comment delete |
| `PATCH` | `/v1/comments/:id/accept` | Proxies Q&A comment accept |
| `POST` | `/v1/comments/:id/vote` | Proxies Q&A comment vote |

The complete generated API inventory is in `../../API_REPORT.md`.

## Local Commands

```sh
pnpm --filter api-gateway dev
pnpm --filter api-gateway build
pnpm --filter api-gateway start
```

Run with the dependent services:

```sh
pnpm --filter auth dev
pnpm --filter notifications dev
pnpm --filter api-gateway dev
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Gateway listen port |
| `AUTH_SERVICE_URL` | `http://localhost:3001` | Auth upstream base URL |
| `NOTIFICATIONS_SERVICE_URL` | `http://localhost:3002` | Notifications upstream base URL |
| `QNA_SERVICE_URL` | `http://localhost:3005` | Q&A upstream base URL |

## Architecture Notes

- The gateway currently fronts Auth, Notifications, Substack, and Q&A traffic.
  Job Service and RecSys are still directly reachable services.
- `/v1/auth/refresh` is declared as an Auth route, but the gateway auth
  middleware currently treats it as protected unless added to public routes.
- Notification proxying forwards the client query string; it does not inject
  the authenticated user id yet.
- `/v1/substacks` and `/v1/substacks/total` are public gateway routes and do
  not require a resolved current user.
