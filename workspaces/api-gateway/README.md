# API Gateway

Public Hono gateway for Solvit browser-facing Auth, Notifications, Substack,
and Q&A topic/comment traffic. It is intentionally thin: it validates the
current user through Auth, forwards requests to upstream services, and
normalizes auth cookies.

## Responsibilities

- Expose public Auth proxy routes.
- Expose the Notifications portal proxy route.
- Expose notification list/read proxy routes with authenticated user id
  injection.
- Expose public substack list, detail, and total-count proxy routes plus
  authenticated owned-list, create, update, delete, subscribe, and unsubscribe
  routes.
- Expose Q&A topic/comment proxy routes.
- Read bearer tokens or `solvit_authToken` cookies.
- Resolve the current user by calling Auth `/v1/auth/profile`.
- Set HTTP-only `solvit_authToken` and `solvit_refreshToken` cookies after
  sign-up, sign-in, and refresh; clear them on sign-out.

## Runtime

- Framework: Hono on `@hono/node-server`
- Default port: `3000`
- Upstreams:
  - Auth: `AUTH_SERVICE_URL`, default `http://localhost:3001`
  - Notifications: `NOTIFICATIONS_SERVICE_URL`, default `http://localhost:3002`
  - Q&A: `QNA_SERVICE_URL`, default `http://localhost:3006`

## API Surface

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Gateway health check |
| `POST` | `/v1/auth/sign-up` | Proxies Auth sign-up and sets auth cookies |
| `POST` | `/v1/auth/sign-in` | Proxies Auth sign-in and sets auth cookies |
| `POST` | `/v1/auth/refresh` | Proxies Auth refresh and sets auth cookies |
| `POST` | `/v1/auth/sign-out` | Proxies Auth sign-out and expires auth cookies |
| `GET` | `/v1/auth/profile` | Returns user resolved by gateway middleware |
| `POST` | `/v1/auth/users/:userId/subscribe` | Proxies user follow |
| `DELETE` | `/v1/auth/users/:userId/subscribe` | Proxies user unfollow |
| `GET` | `/v1/notifications` | Proxies notification list for the authenticated user |
| `PATCH` | `/v1/notifications/:id/read` | Marks an authenticated user's notification as read |
| `GET` | `/v1/substacks` | Public proxy to Auth substack list |
| `GET` | `/v1/substacks/:slug` | Public proxy to Auth substack detail |
| `GET` | `/v1/substacks/total` | Public proxy to Auth approved-substack count |
| `GET` | `/v1/substacks/owned` | Authenticated proxy to the current user's substacks |
| `POST` | `/v1/substacks` | Authenticated proxy to create a substack |
| `PUT` | `/v1/substacks/:slug` | Authenticated proxy to update a substack |
| `DELETE` | `/v1/substacks/:slug` | Authenticated proxy to delete a substack |
| `POST` | `/v1/substacks/:slug/subscribe` | Authenticated proxy to subscribe to a substack |
| `DELETE` | `/v1/substacks/:slug/subscribe` | Authenticated proxy to unsubscribe from a substack |
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
pnpm --filter qna start:dev
pnpm --filter api-gateway dev
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Gateway listen port |
| `AUTH_SERVICE_URL` | `http://localhost:3001` | Auth upstream base URL |
| `NOTIFICATIONS_SERVICE_URL` | `http://localhost:3002` | Notifications upstream base URL |
| `QNA_SERVICE_URL` | `http://localhost:3006` | Q&A upstream base URL |

## Architecture Notes

- The gateway currently fronts Auth, Notifications, Substack, and Q&A traffic.
  Job Service and RecSys are still directly reachable services.
- `/v1/auth/refresh` is public at the gateway so clients can refresh expired
  access tokens with a valid refresh token.
- Notification proxying injects the authenticated user id instead of trusting
  a browser-supplied `userId` query value.
- `/v1/substacks`, `/v1/substacks/total`, and `GET /v1/substacks/:slug` are
  public gateway routes and do not require a resolved current user.
- Q&A proxy routes are protected by gateway auth middleware and forward the
  resolved current user id to Q&A as `x-user-id`.
