# Q&A Service

NestJS service for topics, comments, votes, topic subscriptions, and topic
search.

## Responsibilities

- Manage topic lifecycle: create, update, delete, solve, get details, and
  search.
- Manage comments and accepted answers.
- Track topic/comment votes and topic subscriptions.
- Send internal notification requests for Q&A activity.
- Index topic documents in Elasticsearch for search.

## Runtime And Storage

- Framework: NestJS
- Default port: `3000` unless `PORT` is set
- API docs: `/docs`
- Primary store: MongoDB through Mongoose
- Search store: Elasticsearch at `http://localhost:9200`
- Notification integration: `NOTIFICATION_SERVICE_BASE_URL` plus
  `INTERNAL_SERVICE_SECRET`

When running with the API Gateway locally, set `PORT` to avoid the gateway's
default `3000` port.

## API Surface

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/` | Service root |
| `GET` | `/topics/search` | Search topics through Elasticsearch |
| `POST` | `/topics` | Create topic |
| `GET` | `/topics/:id` | Get topic details |
| `PATCH` | `/topics/:id` | Update topic |
| `DELETE` | `/topics/:id` | Delete topic |
| `PATCH` | `/topics/:id/solve` | Mark topic solved |
| `GET` | `/topics/:id/comments` | List topic comments |
| `POST` | `/topics/:id/vote` | Vote on topic |
| `DELETE` | `/topics/:id/vote` | Remove topic vote |
| `POST` | `/topics/:id/subscribe` | Subscribe to topic |
| `POST` | `/topics/:id/unsubscribe` | Unsubscribe from topic |
| `POST` | `/comments` | Create comment |
| `PATCH` | `/comments/:id` | Update comment |
| `DELETE` | `/comments/:id` | Delete comment |
| `PATCH` | `/comments/:id/accept` | Accept answer |
| `POST` | `/comments/:id/vote` | Vote on comment |

The complete generated API inventory is in `../../API_REPORT.md`.

## Local Commands

```sh
docker compose -f workspaces/qna/docker-compose.yml up -d
PORT=3003 pnpm --filter qna start:dev
pnpm --filter qna build
pnpm --filter qna test
pnpm --filter qna test:e2e
```

PowerShell example:

```powershell
$env:PORT='3003'; pnpm --filter qna start:dev
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `PORT` | Nest listen port |
| `NOTIFICATION_SERVICE_BASE_URL` | Notifications service base URL |
| `INTERNAL_SERVICE_SECRET` | Shared secret for notification creation |

Elasticsearch is provided by `workspaces/qna/docker-compose.yml`.

## Architecture Notes

- MongoDB is currently configured with a hard-coded Atlas connection string in
  `src/database/mongo.module.ts`; move this to environment configuration before
  production use.
- Elasticsearch is hard-coded to `http://localhost:9200` in
  `src/search/search.module.ts`.
- The service currently trusts request `user_id` values. There is no JWT/auth
  middleware enforcing ownership at the service boundary.
- Topic create/update/delete synchronously writes to Elasticsearch after MongoDB
  mutations; decide whether indexing failure should fail user-facing writes.
