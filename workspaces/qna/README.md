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
- Pull personalized topic recommendations from RecSys when search is empty.

## Runtime And Storage

- Framework: NestJS
- Default port: `3006` unless `PORT` is set
- API docs: `/docs`
- Primary store: MongoDB through Mongoose
- Search store: Elasticsearch (`ELASTICSEARCH_URL`, defaults to
  `http://localhost:9200`)
- Notification integration: `NOTIFICATION_SERVICE_BASE_URL` plus
  `INTERNAL_SERVICE_SECRET`
- RecSys integration: `RECSYS_SERVICE_BASE_URL` plus
  `RECSYS_INTERNAL_SERVICE_SECRET`

API Gateway proxies Q&A through `QNA_SERVICE_URL`, which defaults to
`http://localhost:3006`.

## API Surface

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/` | Service root |
| `GET` | `/topics/search` | Search topics through Elasticsearch or fallback to RecSys + newest topics |
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
pnpm --filter qna start:dev
pnpm --filter qna build
pnpm --filter qna test
pnpm --filter qna test:e2e
pnpm --filter qna seed:topics
```

PowerShell example:

```powershell
$env:PORT='3006'; pnpm --filter qna start:dev
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `PORT` | Nest listen port |
| `MONGODB_URI` | MongoDB connection string |
| `ELASTICSEARCH_URL` | Elasticsearch node URL |
| `NOTIFICATION_SERVICE_BASE_URL` | Notifications service base URL |
| `INTERNAL_SERVICE_SECRET` | Shared secret for notification creation |
| `RECSYS_SERVICE_BASE_URL` | RecSys base URL for personalized feed lookups |
| `RECSYS_INTERNAL_SERVICE_SECRET` | Shared secret for RecSys internal events |

Elasticsearch is expected at `ELASTICSEARCH_URL` and defaults to
`http://localhost:9200`. This checkout does not include a Q&A-specific Compose
file, so provide Elasticsearch separately, for example:

```sh
docker start elasticsearch
```

or create a local single-node container:

```sh
docker run -d --name elasticsearch -p 9200:9200 -e discovery.type=single-node -e xpack.security.enabled=false docker.elastic.co/elasticsearch/elasticsearch:8.13.4
```

## Gateway Integration

API Gateway exposes the same topic/comment surface under `/v1`:

- `/topics/*` becomes `/v1/topics/*`.
- `/comments/*` becomes `/v1/comments/*`.
- Gateway-proxied Q&A routes are authenticated at the gateway and receive the
  resolved current user id in the `x-user-id` header.

## Architecture Notes

- MongoDB connection reads `MONGODB_URI` with a `localhost` fallback for local
  dev (`src/database/mongo.module.ts`).
- Elasticsearch reads `ELASTICSEARCH_URL` with a `http://localhost:9200`
  fallback (`src/search/search.module.ts`). The `topics` index is created on
  service bootstrap if missing.
- Package scripts use `ts-node` and `tsc` directly instead of the Nest CLI so
  they work with the repo's exFAT-safe hoisted pnpm install.
- The service currently trusts the caller-supplied `x-user-id` header. There
  is no JWT/auth middleware enforcing ownership at the Q&A service boundary.
- Topic create/update/delete synchronously writes to Elasticsearch after MongoDB
  mutations; decide whether indexing failure should fail user-facing writes.
- Empty `/topics/search` queries pull RecSys feed items (when available) and
  then fill with newest non-substack topics. RecSys failures are silently
  ignored to avoid breaking search.
