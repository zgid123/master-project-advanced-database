# Auth Service

Hono service that owns identity, refresh tokens, user follows, substacks, and
substack membership for Solvit.

## Responsibilities

- Create and authenticate users.
- Issue short-lived JWT access tokens and opaque Redis-backed refresh tokens.
- Resolve the current user profile from an access token.
- Manage user-to-user subscriptions.
- Manage substacks, approved-substack listing/counts, substack subscriptions,
  and admin substack approval.
- Emit internal notification requests for sign-up, social, and substack events.

## Runtime And Storage

- Framework: Hono on `@hono/node-server`
- Default port: first available from `3001`
- Primary store: PostgreSQL through Drizzle
- Token store: Redis
- Internal integration: Notifications `/internal/v1/notifications`

## API Surface

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `POST` | `/v1/auth/sign-up` | Create user, issue tokens, enqueue welcome notification |
| `POST` | `/v1/auth/sign-in` | Validate credentials and issue tokens |
| `POST` | `/v1/auth/refresh` | Exchange refresh token for new auth/refresh tokens |
| `POST` | `/v1/auth/sign-out` | Revoke a refresh token |
| `GET` | `/v1/auth/profile` | Requires auth token; returns current user profile |
| `POST` | `/v1/auth/users/:userId/subscribe` | Follow another user |
| `DELETE` | `/v1/auth/users/:userId/subscribe` | Unfollow another user |
| `GET` | `/v1/substacks` | List approved substacks; optional `limit` |
| `GET` | `/v1/substacks/total` | Count approved substacks |
| `POST` | `/v1/substacks` | Create a substack owned by the current user |
| `GET` | `/v1/substacks/:slug` | Get substack by slug |
| `POST` | `/v1/substacks/:slug/subscribe` | Subscribe to a substack |
| `DELETE` | `/v1/substacks/:slug/subscribe` | Unsubscribe from a substack |
| `POST` | `/admin/substacks/:slug/approve` | Admin-only substack approval |

The complete generated API inventory is in `../../API_REPORT.md`.

## Local Commands

```sh
pnpm --filter auth db:migrate
pnpm --filter auth dev
pnpm --filter auth build
pnpm --filter auth start
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection |
| `JWT_SECRET`, `JWT_ALG` | JWT signing and verification |
| `REDIS_URL` | Refresh token storage |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeded admin account |
| `NOTIFICATIONS_SERVICE_URL` | Notifications service base URL |
| `INTERNAL_SERVICE_SECRET` | Shared secret for internal notification calls |

## Architecture Notes

- JWT `sub` is currently the user's email. Other services must not assume it is
  a MongoDB ObjectId or any other service-specific user id unless the token
  contract is changed.
- Sign-up currently hashes the password before calling the repository, and the
  repository hashes again. New sign-ups should be verified after this is fixed.
- Auth owns substack data in PostgreSQL. Gateway and Dashboard now read the
  approved-substack list, detail, and total count from Auth.
- RecSys only receives derived graph structure when event integration is added.
