# Notifications Service

Hono service that stores user notifications and accepts internal system-event
requests from other Solvit services.

## Responsibilities

- Store notification documents in MongoDB.
- List portal notifications for a user.
- Mark a notification as read.
- Convert internal system notification payloads into user-facing title/body
  notification documents.
- Support single and batch internal notification creation.

## Runtime And Storage

- Framework: Hono on `@hono/node-server`
- Default port: first available from `3002`
- Store: MongoDB through Mongoose
- Shared domain package: `@domain/notification`

## API Surface

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `GET` | `/v1/notifications` | Requires `userId`; optional `read`, `limit` |
| `PATCH` | `/v1/notifications/:id/read` | Requires `userId`; marks one notification read |
| `POST` | `/internal/v1/notifications` | Internal single system notification |
| `POST` | `/internal/v1/notifications/batch` | Internal batch system notifications |

Internal routes require `x-internal-service-secret`.

The complete generated API inventory is in `../../API_REPORT.md`.

## Local Commands

```sh
pnpm --filter notifications dev
pnpm --filter notifications build
pnpm --filter notifications start
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string used at runtime |
| `INTERNAL_SERVICE_SECRET` | Shared secret for internal creation routes |

## Architecture Notes

- Portal routes currently trust `userId` query parameters. Prefer gateway
  injection of the authenticated user id before exposing this service directly.
- Runtime code reads `MONGODB_URI`, while the environment type declaration still
  names `MONGO_URI`; keep deployments aligned with runtime behavior.
- `read` query parsing currently uses boolean coercion, so string values such as
  `read=false` need careful handling before relying on filtering semantics.
