# RecSys Service

Database-first recommendation service for Solvit. It keeps behavioral and graph structure only, with Q&A/Auth remaining the source of truth.

## Stack

- Node.js 20 + TypeScript
- Fastify HTTP API
- Neo4j 5 for graph traversal
- Redis Streams for event ingestion
- Redis cache for feed, trending, and subscriptions
- BullMQ for scheduled popularity and similarity jobs
- Prometheus metrics and Pino logs

## Local flow

```sh
docker compose up -d redis neo4j
pnpm --filter recsys migrate
pnpm --filter recsys consume-events
pnpm --filter recsys worker
pnpm --filter recsys dev
```

The service listens on `http://localhost:3020` by default. Swagger UI is at `/docs`.

## API

- `GET /v1/feed?cursor=<base64>&limit=20` with `x-user-id`
- `GET /v1/topics/:id/similar?limit=20`
- `GET /v1/users/:id/suggested-substacks?limit=20`
- `POST /v1/internal/events/vote`
- `POST /v1/internal/events/subscription`
- `POST /v1/internal/events/topic`
- `POST /v1/internal/events/comment`
- `POST /v1/internal/events/substack`
- `GET /v1/health`
- `GET /metrics`

Internal event routes require `x-internal-service-secret`.

## Events

Vote events:

```json
{ "type": "vote.created", "userId": "123", "targetType": "topic", "targetId": "456", "voteType": "up", "createdAt": 1715400000, "eventId": "uuid" }
```

Subscription events:

```json
{ "type": "subscription.created", "userId": "123", "targetType": "substack", "targetId": "99", "createdAt": 1715400000, "eventId": "uuid" }
```

Structural upsert events keep Neo4j queryable without storing original content:

```json
{ "type": "topic.upsert", "topicId": "456", "substackId": "99", "createdAt": 1715400000, "eventId": "uuid" }
```

Substack upserts may repair an authoritative subscriber count. The count is
applied only when `subscriberCountAt` is newer than the stored value; envelope
`emittedAt` is normalized into `subscriberCountAt` when the field is omitted.
Subscription create/delete events remain the normal source for incremental
count changes.

```json
{ "type": "substack.upsert", "substackId": "99", "createdAt": 1715400000, "subscriberCount": 42, "subscriberCountAt": 1715400300, "eventId": "uuid" }
```

IDs are normalized to strings at the service boundary for the current
cross-service prototype. Moving RecSys to Neo4j integer/BIGINT ids is a
production hardening task because it requires coordinated event, API, data, and
constraint migration.

## Benchmark

```sh
pnpm --filter recsys seed
pnpm --filter recsys bench:feed
```

For the target benchmark dataset:

```sh
$env:SEED_USERS='100000'
$env:SEED_TOPICS='500000'
$env:SEED_VOTES='5000000'
$env:SEED_SUBSCRIPTIONS='200000'
pnpm --filter recsys seed
```
