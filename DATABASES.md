# Solvit Databases

This document describes the database choices for each service, their schemas,
and the rationale behind each choice. Information here is derived from the
schema/migration files committed in the repository — see
[ARCHITECTURE.md](ARCHITECTURE.md) for the higher-level system view.

## Storage Topology

| Service | Primary store | Auxiliary stores | Why |
| --- | --- | --- | --- |
| Auth | PostgreSQL 16 | Redis 7 | Strong relational integrity for users/roles/substacks; Redis as a low-latency refresh-token allow-list |
| Notifications | MongoDB 7 | — | Flexible per-event `metadata`, time-ordered reads per `userId` |
| Q&A | MongoDB 7 | Elasticsearch | Schema-light topic/comment documents with full-text search offloaded to Elasticsearch |
| Job Service | MongoDB 7 | Redis 7 | Document model fits job + denormalized application data; transactional outbox needs a single store; Redis for cache, rate limit, idempotency |
| RecSys | Neo4j 5 | Redis 7, BullMQ | Recommendation queries are inherently graph traversals; Redis Streams for event ingestion, BullMQ for batch jobs |

```mermaid
flowchart LR
  Auth -->|Drizzle| Postgres[(PostgreSQL\nauth schema)]
  Auth -->|ioredis| RedisAuth[(Redis\nrefresh_token:*)]
  Notifications -->|Mongoose| MongoN[(MongoDB\nnotifications)]
  Qna -->|Mongoose| MongoQ[(MongoDB\nqna)]
  Qna -->|@elastic/elasticsearch| ES[(Elasticsearch\ntopics)]
  Jobs -->|Mongoose| MongoJ[(MongoDB\njobs)]
  Jobs -->|ioredis| RedisJ[(Redis\ncache/rate-limit/streams)]
  RecSys -->|neo4j-driver| Neo4j[(Neo4j\nbehavioral graph)]
  RecSys -->|ioredis + BullMQ| RedisR[(Redis\nevents:* streams + queues)]
```

---

## Auth Service

Path: `workspaces/auth`

### Storage

- **PostgreSQL 16** via [Drizzle ORM](https://orm.drizzle.team/) — schemas in
  [src/infrastructure/drizzle/schemas](workspaces/auth/src/infrastructure/drizzle/schemas).
- **Redis 7** via `ioredis` — refresh-token allow-list at
  [src/modules/auth/infrastructure/redis/repositories/AllowedTokenRepository.ts](workspaces/auth/src/modules/auth/infrastructure/redis/repositories/AllowedTokenRepository.ts).

### Why these stores

- **PostgreSQL** is the right fit for identity data: users, roles, substacks,
  memberships, and follows are highly relational with strict integrity needs
  (unique emails, FK cascades, unique join rows). Drizzle gives a typed schema
  while keeping raw SQL access for migrations and full-text search.
- **Substack full-text search** is implemented inside PostgreSQL itself with a
  `tsvector` generated column and a GIN index — small enough that pulling in
  Elasticsearch would be overkill.
- **Redis** holds refresh-token allow-list entries (`refresh_token:<token>`).
  Refresh tokens are opaque, short-lived, and frequently revoked; Redis gives
  O(1) lookup with TTL-based expiry and no need to write the row into Postgres.

### Schemas

| Table | Purpose | Notable columns / indexes |
| --- | --- | --- |
| `roles` | Role lookup | `name` unique |
| `users` | User identity | `email` unique notNull, `password`, `roleId` FK→roles, `status` ∈ {active, inactive, suspended}, `reputationScore` int default 0 |
| `users_subscriptions` | User-follows-user | `(userId, followerId)` unique; both FKs cascade |
| `substacks` | Substack catalog | `name`/`slug` unique, `approved` boolean, `ownerId` FK→users (cascade), `deletedAt` soft delete, `searchVector` tsvector generated from `name + description`, GIN `search_index` |
| `substack_roles` | Role names per substack | `(substackId, name)` unique |
| `substack_role_assignments` | Role grants per user/substack | `(substackRoleId, userId)` unique |
| `substacks_subscriptions` | User-subscribes-substack | `(substackId, userId)` unique |

All ids are `UUID` via the shared `baseUuidSchema`; all tables carry
`createdAt`/`updatedAt`/`deletedAt` timestamps from the shared
`timestampsSchema` helper.

### Redis keys

| Key | Type | Purpose |
| --- | --- | --- |
| `refresh_token:<opaque-token>` | string | Allow-listed refresh token; deleted on sign-out or rotation |

`ioredis` client is configured with `lazyConnect`, `maxRetriesPerRequest: 1`,
`enableOfflineQueue: false` so that a Redis outage fails fast instead of
queuing writes silently.

---

## Notifications Service

Path: `workspaces/notifications`

### Storage

- **MongoDB 7** via [Mongoose](https://mongoosejs.com/) — schema at
  [src/infrastructure/mongoose/schemas/notifications.ts](workspaces/notifications/src/infrastructure/mongoose/schemas/notifications.ts).

### Why MongoDB

- Each notification family (`auth.sign-up.welcome`, `qna.topic.upvoted`,
  `substack.approved`, …) carries different `metadata` shapes. A single
  document model with a flexible `metadata` field avoids a schema migration
  every time a new system event ships.
- Access pattern is per-user inbox, time-descending — well served by a
  `(userId, read, createdAt)` compound index.
- No cross-entity joins, no transactional needs beyond a single document insert.

### Collection: `notifications`

| Field | Type | Notes |
| --- | --- | --- |
| `title` | String | required, trimmed |
| `body` | String | required, trimmed |
| `sent` | Boolean | default `false` (delivery-channel flag) |
| `read` | Boolean | default `false` |
| `metadata` | Mixed | per-family payload (e.g. `{ topicId, voterId }`); default `null` |
| `userId` | String | required, indexed |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Indexes:

- `{ userId: 1 }` — bare user lookup
- `{ userId: 1, read: 1, createdAt: -1 }` — primary inbox query (unread, newest first)

System notification families are normalized inside the service
([SystemNotificationService](workspaces/notifications/src/modules/notification/domain/services/SystemNotificationService.ts))
so the document only stores the rendered title/body plus structured metadata.

---

## Q&A Service

Path: `workspaces/qna`

### Storage

- **MongoDB 7** via Mongoose — schemas under
  [src/topics](workspaces/qna/src/topics/schemas/topic.schema.ts),
  [src/comments](workspaces/qna/src/comments/schemas/comment.schema.ts),
  [src/votes](workspaces/qna/src/votes/schemas/vote.schema.ts),
  [src/topic_subscriptions](workspaces/qna/src/topic_subscriptions/schemas/topic_subscription.schema.ts).
- **Elasticsearch** as the topic search index — bootstrap and queries in
  [src/search/search.service.ts](workspaces/qna/src/search/search.service.ts).

### Why these stores

- **MongoDB** holds the canonical topic/comment lifecycle. Documents are
  largely independent (no joins), votes are append-only counters, and the
  service evolves field shapes (e.g. adding `substack_id`) without alembic-style
  migrations.
- **Elasticsearch** owns full-text search over `title` + `body` with relevance
  scoring, fuzzy match, and `substack_id` filtering — things MongoDB text
  indexes don't do as well. Writes are best-effort and asynchronous to MongoDB
  so an Elasticsearch outage cannot break topic creation.

### MongoDB collections

| Collection | Key fields | Indexes |
| --- | --- | --- |
| `topics` | `title`, `body`, `slug`, `is_solved`, `user_id`, `substack_id`, `deleted_at` | `slug` unique; `user_id`; `created_at desc`; `title` text |
| `comments` | `topic_id` (ObjectId), `user_id`, `content`, `is_accepted`, `deleted_at` | `topic_id`; `user_id` |
| `votes` | `target_id`, `target_type` ∈ {topic, comment}, `user_id`, `point` | `(target_id, target_type, user_id)` unique — one vote per user per target |
| `topic_subscriptions` | `topic_id`, `user_id` | `(topic_id, user_id)` unique |

All collections use Mongoose `timestamps: true` (`created_at`, `updated_at`).
Soft deletes use `deleted_at`.

### Elasticsearch index: `topics`

| Field | Type |
| --- | --- |
| `title` | text |
| `body` | text |
| `substack_id` | keyword |
| `created_at` | date |

Lifecycle:

- Topic create/update/delete writes to Elasticsearch (best-effort).
- `GET /topics/search` hits Elasticsearch, then loads hydrated documents from
  MongoDB by `_id`.
- Empty/global search can blend in RecSys recommendations and fall back to the
  newest MongoDB topics.

---

## Job Service

Path: `workspaces/job-service`

### Storage

- **MongoDB 7** via Mongoose — collections and JSON-Schema validators are
  installed by the migration at
  [src/db/migrations/001_indexes.ts](workspaces/job-service/src/db/migrations/001_indexes.ts).
- **Redis 7** via `ioredis` — cache, rate-limit, idempotency, and event stream
  publisher at [src/cache/redis.ts](workspaces/job-service/src/cache/redis.ts)
  and [src/events/publisher.ts](workspaces/job-service/src/events/publisher.ts).

### Why these stores

- **MongoDB** lets the service co-locate the job document, its embedded
  `metadata`, denormalized application fields, and the **transactional outbox**
  in one place — outbox inserts run inside the same multi-document transaction
  as the business mutation, so events can never desync from state.
- **JSON Schema validators** are attached to every collection through
  `collMod`, providing server-enforced constraints (enums, lengths, required
  fields) without an ORM.
- **Redis** handles ephemeral concerns: cached job reads, idempotency-key
  caching for client retries, sliding-window application rate limits, and
  publishing to the `jobs.events` stream after the outbox is claimed.

### Collections

**`jobs`** — JSON Schema validator + indexes:

| Field | Type / constraint |
| --- | --- |
| `postedByUserId` | ObjectId, required |
| `title` | string, 3–200 chars, required |
| `content` | string, ≤ 20 000 |
| `location` | string, ≤ 120 |
| `jobType` | enum: `full_time` / `part_time` / `contract` / `internship` |
| `status` | enum: `draft` / `open` / `closed` / `archived`, required |
| `tags` | array (≤ 16 items, ≤ 32 chars each) |
| `applicationCount` | int ≥ 0, required |
| `metadata` | free-form object |
| `deletedAt` | date or null |

Indexes:

- `idx_jobs_postedBy` on `postedByUserId`
- `idx_jobs_open_listing` on `{createdAt:-1, _id:-1}` *partial:* `status = "open"` — drives keyset pagination
- `idx_jobs_text` text index over `title`, `content`, `location` with weights
- `idx_jobs_tags_recency` on `{tags:1, createdAt:-1}`
- `idx_jobs_metadata_wildcard` wildcard index on `metadata.*`

**`job_applications`**:

| Field | Type / constraint |
| --- | --- |
| `jobId` | ObjectId, required |
| `applicantUserId` | ObjectId, required |
| `coverLetter` | string ≤ 5 000 |
| `resumeUrl` | string ≤ 500 |
| `status` | enum: `submitted` / `reviewing` / `accepted` / `rejected` / `withdrawn`, required |
| `idempotencyKey` | string ≤ 80 |
| `denormalized` | `{ jobTitle, jobPostedByUserId }` |
| `metadata` | object |
| `deletedAt` | date or null |

Indexes:

- `idx_apps_job_status_recency` — list-by-job
- `idx_apps_user_recency` — list-by-applicant
- `idx_apps_user_job_status` — duplicate-application check
- `uniq_apps_idempotency` — unique, partial (only when key is set)
- `ttl_withdrawn_180d` — TTL 180 days on withdrawn applications

**`job_outbox`** — transactional outbox:

| Field | Type |
| --- | --- |
| `topic` | string, required |
| `payload` | object, required |
| `status` | enum: `pending` / `publishing` / `published` / `failed`, required |
| `publishedAt` | date or null |
| `lastError` | string |
| `attempts` | int ≥ 0, required |

Indexes: `idx_outbox_claim_pending`, `idx_outbox_claim_publishing`,
`idx_outbox_claim_failed` — the publisher claims documents by status.

**`idempotency_keys`** — TTL 24 hours.

### Redis usage

| Pattern | Purpose |
| --- | --- |
| Job read cache | Reduce read pressure on hot job documents |
| Idempotency cache | Short-circuit duplicate `POST /v1/jobs/:id/applications` calls |
| Rate-limit keys | Throttle application submissions per user |
| Stream `jobs.events` | Outbox publisher emits `XADD` after the document is claimed |

---

## Recommendation Service (RecSys)

Path: `workspaces/recsys`

### Storage

- **Neo4j 5** via the official `neo4j-driver` — schema bootstrap in
  [src/neo4j/migrations.ts](workspaces/recsys/src/neo4j/migrations.ts).
- **Redis 7** for event ingestion streams and recommendation caches —
  [src/events/stream.ts](workspaces/recsys/src/events/stream.ts).
- **BullMQ** (on Redis) for batch jobs —
  [src/jobs/queue.ts](workspaces/recsys/src/jobs/queue.ts).

### Why these stores

- **Neo4j** is the natural fit: recommendations are graph traversals
  (collaborative filtering, "users who voted X also voted Y", similar-substack
  expansion, MMR rerank). Modeling the same thing in a relational store would
  require multiple self-joins per query.
- Neo4j **GDS** (Graph Data Science) ships `FastRP` embeddings + `KNN` out of
  the box, which the `refresh-similarity` job uses to materialize `SIMILAR_TO`
  edges.
- **Redis Streams** decouple producers (Auth, Q&A, Job Service) from the
  RecSys consumer. Consumer groups give at-least-once delivery with
  `XAUTOCLAIM` for stalled messages; `ProcessedEvent` nodes in Neo4j provide
  exactly-once *effects*.
- **BullMQ** schedules cron-style batch jobs without bolting on a separate
  scheduler.

### Neo4j schema

**Node labels** (all with a `UNIQUE` constraint on `id`):

| Label | Notable properties |
| --- | --- |
| `User` | `createdAt`, `lastSeenAt` |
| `Topic` | `voteScore`, `hotness`, `authorId`, `substackId`, `createdAt` |
| `Comment` | references topic + author |
| `Substack` | `subscriberCount`, `subscriberCountAt` |
| `ProcessedEvent` | dedupe marker — `id` is the source event id; pruned by batch job |

**Relationships**:

| Rel | Direction | Properties |
| --- | --- | --- |
| `(:User)-[:VOTED]->(:Topic|:Comment)` | | `voteType` (1 / -1), `votedAt` |
| `(:User)-[:SUBSCRIBED]->(:Substack|:User|:Topic)` | | `since` |
| `(:User)-[:AUTHORED]->(:Topic|:Comment)` | | `at` |
| `(:Topic)-[:IN_SUBSTACK]->(:Substack)` | | `since` |
| `(:Topic)-[:SIMILAR_TO]->(:Topic)` | | `score`, `computedAt` (materialized by GDS KNN) |

**Indexes** (created by `migrations.ts`):

- Node: `topic_created`, `topic_substack_id`, `topic_hotness`,
  `topic_substack_hotness`, `user_last_seen`
- Relationship: `voted_at`, `subscribed_since`, `similar_to_score`,
  `similar_to_computed`

### Redis usage

**Streams** (`MAXLEN ≈ 1 000 000`, fields `type` / `eventId` / `payload` JSON):

- `events:vote`
- `events:subscription`
- `events:topic`
- `events:comment`
- `events:substack`

Consumed via a single `XREADGROUP` consumer group with periodic `XAUTOCLAIM`
for crashed consumers.

**Caches**:

- Personalized feed (first-page snapshot per user)
- Trending feed
- User subscription set

**BullMQ queue** (`recsys.batch`) — repeatable cron jobs:

| Job | What it does |
| --- | --- |
| `refresh-popularity` | Recompute `Topic.voteScore` and `Topic.hotness` |
| `refresh-similarity` | Run GDS FastRP + KNN, write `SIMILAR_TO` edges |
| `prune-processed-events` | Delete old `ProcessedEvent` dedupe markers |

Retention: `removeOnComplete: 20`, `removeOnFail: 50`.

---

## Cross-Service Data Ownership

| Data | Owner | Store | Cross-service handle |
| --- | --- | --- | --- |
| Users, roles, follows | Auth | PostgreSQL | UUID — source of truth |
| Substacks, memberships | Auth | PostgreSQL | UUID + `slug` |
| Notifications | Notifications | MongoDB | `userId` from caller |
| Topics, comments, votes, subscriptions | Q&A | MongoDB | ObjectId; `user_id` is a string from caller |
| Topic search documents | Q&A | Elasticsearch | mirrors `topics._id` |
| Jobs, applications | Job Service | MongoDB | ObjectId; user ids are ObjectId-hex strings |
| Job/application events | Job Service | MongoDB outbox → Redis stream `jobs.events` | — |
| Behavioral graph | RecSys | Neo4j | mirrors source-of-truth ids as `User.id`, `Topic.id`, etc. |
| Recommendation caches / event streams | RecSys | Redis | — |

Open questions that touch storage (see [ARCHITECTURE.md](ARCHITECTURE.md#architecture-review-notes)):

1. **Canonical user id shape** — Auth issues UUIDs, Job Service expects
   ObjectId hex in the JWT `sub`. The two stores need a contract.
2. **Q&A `user_id` is a free-form string** — relies on the gateway to inject a
   trusted id via `x-user-id`. Direct service access does not.
3. **No bridge between `jobs.events` and `events:*`** — RecSys currently does
   not ingest job activity.
4. **Elasticsearch is not in the root `docker-compose.yml`** — run a separate
   single-node container on `:9200` for local Q&A search.
