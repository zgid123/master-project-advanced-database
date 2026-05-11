# Recommendation Service

Fastify recommendation service for personalized feeds, trending topics, similar
topics/users, and suggested substacks. It stores derived graph and behavioral
state only; Auth and Q&A remain the source of truth.

## Responsibilities

- Serve personalized and trending recommendation APIs.
- Ingest vote, subscription, topic, comment, and substack events from Redis
  Streams.
- Maintain a Neo4j graph for users, topics, substacks, and relationships.
- Cache feed, trending, and subscription lookups in Redis.
- Run BullMQ jobs for popularity refresh, similarity refresh, and processed
  event pruning.
- Expose Prometheus metrics.

## Runtime And Storage

- Framework: Fastify
- Default port: `3020`
- API docs: `/docs`
- Graph store: Neo4j
- Streams/cache/jobs: Redis and BullMQ
- Metrics: `/metrics` and `/internal/metrics`

## API Surface

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/` | Service root |
| `GET` | `/health` | Public health check |
| `GET` | `/v1/health` | Versioned health check |
| `GET` | `/internal/health` | Internal health check |
| `GET` | `/internal/ready` | Neo4j and Redis readiness |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/internal/metrics` | Internal metrics alias |
| `GET` | `/v1/feed` | Personalized feed; requires `x-user-id` |
| `GET` | `/v1/trending` | Trending topics |
| `GET` | `/v1/topics/:id/similar` | Similar topics |
| `GET` | `/v1/similar/topics/:id` | Similar topics alias |
| `GET` | `/v1/users/:id/suggested-substacks` | Suggested substacks |
| `GET` | `/v1/similar/users/:id` | Similar users |
| `POST` | `/internal/reindex/user/:userId` | Recompute one user's cache/graph state |
| `POST` | `/v1/internal/events/vote` | Append vote event |
| `POST` | `/v1/internal/events/subscription` | Append subscription event |
| `POST` | `/v1/internal/events/topic` | Append topic event |
| `POST` | `/v1/internal/events/comment` | Append comment event |
| `POST` | `/v1/internal/events/substack` | Append substack event |

Internal event routes require `x-internal-service-secret`.

The complete generated API inventory is in `../../API_REPORT.md`.

## Local Commands

```sh
docker compose up -d redis neo4j
pnpm --filter recsys migrate
pnpm --filter recsys consume-events
pnpm --filter recsys worker
pnpm --filter recsys dev
```

Validation:

```sh
pnpm --filter recsys typecheck
pnpm --filter recsys test
pnpm --filter recsys build
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3020` | Listen port |
| `HOST` | `0.0.0.0` | Listen host |
| `REDIS_URL` | `redis://localhost:6379` | Streams, cache, BullMQ |
| `NEO4J_URI` | `neo4j://localhost:7687` | Neo4j connection |
| `NEO4J_USER` | `neo4j` | Neo4j user |
| `NEO4J_PASSWORD` | `recsys-password` | Neo4j password |
| `INTERNAL_SERVICE_SECRET` | `dev-internal-secret` | Internal route secret |
| `EVENTS_*_STREAM` | `events:*` | Redis Stream names |
| `JOB_QUEUE_NAME` | `recsys.batch` | BullMQ queue name |

## Event Model

RecSys accepts events through internal HTTP routes, writes them to Redis
Streams, then consumers update Neo4j with idempotency through processed-event
tracking.

Event families:

- `vote.created`, `vote.deleted`
- `subscription.created`, `subscription.deleted`
- `topic.upsert`, `topic.deleted`
- `comment.upsert`, `comment.deleted`
- `substack.upsert`, `substack.deleted`

IDs are normalized to strings at service boundaries for the current prototype.

## Benchmark Commands

```sh
pnpm --filter recsys seed
pnpm --filter recsys bench:feed
```

Large seed example:

```powershell
$env:SEED_USERS='100000'
$env:SEED_TOPICS='500000'
$env:SEED_VOTES='5000000'
$env:SEED_SUBSCRIPTIONS='200000'
pnpm --filter recsys seed
```

## Architecture Notes

- RecSys is implemented as a standalone service, but API Gateway does not proxy
  its routes yet.
- Auth and Q&A do not currently push RecSys events in this repo.
- `/v1/feed` trusts `x-user-id`; expose it only behind a trusted gateway or add
  direct JWT validation before public exposure.
- Job Service publishes `jobs.events`, while RecSys consumes `events:*`; a
  bridge or common event contract is still needed.
