# Sprint 2 — Interactions + Async Backbone

> **Goal:** Add Comment, Vote, Notification services and introduce the **event-driven backbone** (Kafka). Existing Sprint 1 services begin publishing domain events. Notification Service consumes them.
> **Exit criteria:** E2E `user A asks → user B answers → user A receives a notification (in `notification_db` and via realtime channel)` is green.

Mirrors HLD §18 Sprint 2.

---

## Scope (services delivered in this sprint)

- Redis wired into all services that need it
- Kafka + Zookeeper operational with full topic catalog
- Comment Service
- Vote Service
- Notification Service (with realtime fanout)
- All existing services (User, Tag, Question, Answer + the new Sprint 2 services) become **producers** of their domain events

---

## Common Definition of Done (every new service this sprint)

- All Sprint 1 DoD items (migrations, OpenAPI, tests, healthchecks, compose)
- Service publishes its domain events through `@devqa/kafka` using the envelope from `@devqa/contracts/events`
- Service handlers are **idempotent** for any inbound event (use `withIdempotency` from S0-LIB-06)

---

## Tasks

### Async backbone

#### S2-INFRA-01 — Redis wired to services
- Depends on: S0-INFRA-01, S0-LIB-01
- Deliverable:
  - Redis 7 healthy in compose
  - `@devqa/redis` thin module (or extension of `@devqa/config`) with namespaced key prefixes per service (`<service>:<purpose>:<key>`)
  - Used by: Notification Service (online registry), Vote Service (counter cache), API Gateway (rate-limit counters), `@devqa/kafka` (idempotency dedupe set)
- Definition of done: a service writing under `vote:counter:q-123` cannot accidentally collide with `notification:online:user-7`
- Owner: _unassigned_
- Status: ⏳

#### S2-INFRA-02 — Kafka + Zookeeper + topic provisioning
- Depends on: S0-INFRA-01, S0-LIB-06
- Deliverable:
  - Kafka 3.7 + Zookeeper healthy in compose
  - `infra/kafka/topics.yaml` declaring every topic from HLD §8 with partitions / replication / retention
  - `infra/kafka/provision.ts` (run as a one-shot `topic-init` compose service) that creates all topics on startup, idempotent
  - Topics: `user.profile.updated`, `user.followed`, `tag.created`, `tag.followed`, `question.created`, `question.updated`, `question.deleted`, `question.watched`, `question.closed`, `answer.created`, `answer.updated`, `answer.accepted`, `comment.created`, `vote.changed`, `notification.requested`, `media.uploaded`, `moderation.action.created`
  - One dead-letter topic per consumer group: `<topic>.dlq.<group>`
- Definition of done: `kafka-topics --list` after compose-up shows every declared topic; rerunning provision is a no-op
- Owner: _unassigned_
- Status: ⏳

#### S2-LIB-01 — Verify `@devqa/kafka` end-to-end with real Kafka
- Depends on: S0-LIB-06, S2-INFRA-02
- Deliverable: replace any local-only test stubs with full kafkajs path; integration test in CI uses Testcontainers Kafka
- Definition of done: produce → consume round-trip in CI; idempotency dedupe verified by replaying the same `eventId` twice (handler runs once)
- Owner: _unassigned_
- Status: ⏳

### New domain services

#### S2-COMMENT-01 — Comment Service schema + migrations
- Depends on: S0-INFRA-02, S0-REPO-03
- Deliverable: table `comments` (id, target_type enum [question|answer], target_id, author_id, body_md, status enum [active|deleted|edited], parent_comment_id nullable, depth int check ≤ 2, created_at, updated_at). Indexes on `(target_type, target_id, created_at)`, `(author_id)`.
- Definition of done: migration runs; depth constraint rejects deeply-nested comments at the DB level
- Owner: _unassigned_
- Status: ⏳

#### S2-COMMENT-02 — Comment Service API + events
- Depends on: S2-COMMENT-01, S0-LIB-03, S2-LIB-01
- Deliverable:
  - `POST /comments` { targetType, targetId, body, parentCommentId? }
  - `GET /comments?targetType=...&targetId=...`
  - `PATCH /comments/:id` (author only) — sets status to `edited`, records edit history (separate audit table or JSON column)
  - `DELETE /comments/:id` — soft delete
  - Publishes `comment.created` on creation
- Definition of done: integration tests cover happy + soft-delete + edit; event published with correct envelope
- Owner: _unassigned_
- Status: ⏳

#### S2-VOTE-01 — Vote Service schema + migrations
- Depends on: S0-INFRA-02, S0-REPO-03
- Deliverable: table `votes` (id, user_id, target_type enum [question|answer], target_id, value smallint check in (-1, 1), created_at, updated_at). Indexes: unique `(user_id, target_type, target_id)`, `(target_type, target_id)`.
- Definition of done: migration runs; unique constraint enforces one vote per user per target
- Owner: _unassigned_
- Status: ⏳

#### S2-VOTE-02 — Vote Service API (idempotent transitions) + events
- Depends on: S2-VOTE-01, S0-LIB-03, S2-LIB-01, S2-INFRA-01
- Deliverable:
  - `PUT /votes` { targetType, targetId, value: 1 | -1 | 0 } — idempotent: setting same value is a no-op; switching value updates row; value=0 deletes row
  - `GET /votes/me?targetType=...&targetIds=...` — returns the caller's votes for a batch of targets
  - `GET /votes/counters?targetType=...&targetId=...` — sums (read-through Redis cache, TTL ~30s)
  - On every transition publishes `vote.changed` with `{ targetType, targetId, userId, oldValue, newValue, deltaUp, deltaDown }`
- Definition of done: 100 concurrent votes from the same user on the same target produce one row and one event for the final state (use SELECT FOR UPDATE or upsert)
- Owner: _unassigned_
- Status: ⏳

#### S2-NOTIF-01 — Notification Service schema + migrations
- Depends on: S0-INFRA-02, S0-REPO-03
- Deliverable: tables `notifications` (id, recipient_user_id, type, title, body, payload jsonb, source_event_id, created_at, read_at nullable), `notification_delivery_log` (notification_id, channel enum [websocket|email|none], delivered_at, status enum [delivered|failed|skipped], error). Indexes on `(recipient_user_id, created_at desc)`, `(recipient_user_id, read_at)` partial index where `read_at is null`.
- Definition of done: migration runs; `source_event_id` column has unique index for idempotent ingestion
- Owner: _unassigned_
- Status: ⏳

#### S2-NOTIF-02 — Notification Service consumers + recipient resolution
- Depends on: S2-NOTIF-01, S2-LIB-01, S1-QUESTION-02, S1-USER-02
- Deliverable: Kafka consumers for:
  - `answer.created` → notify question author + watchers
  - `answer.accepted` → notify answer author
  - `comment.created` → notify target author + (for nested) parent comment author
  - `vote.changed` → optional, notify only on milestones (e.g. crossing +5 / +10) to avoid spam
  - `question.watched` → no notification, but updates the watcher set the service consults later
  - `tag.followed` + `question.created` → cross-stream join is **not** done here (Feed Projector handles it in Sprint 3)
- Each consumer:
  - Resolves recipient set
  - Persists notification rows (skips duplicates via `source_event_id` unique constraint)
  - Calls `RealtimeFanout.send(userId, notification)` (next task)
- Definition of done: replaying a Kafka topic from offset 0 results in the same notification rows (no duplicates)
- Owner: _unassigned_
- Status: ⏳

#### S2-NOTIF-03 — Realtime fanout (websocket/SSE) + Redis online registry
- Depends on: S2-NOTIF-02, S2-INFRA-01
- Deliverable:
  - WebSocket gateway at `/ws/notifications` (NestJS `@WebSocketGateway`) authenticating via JWT in connection params
  - On connect: `SADD notification:online:<userId> <connectionId>`, `EXPIRE` refreshed by heartbeat; on disconnect: `SREM`
  - `RealtimeFanout.send(userId, notification)` checks the online set and pushes to active connections (this single-node implementation is acceptable for class scope; document Redis pub/sub fanout as the multi-node evolution)
  - Endpoint `GET /notifications` (paginated), `POST /notifications/:id/read`, `POST /notifications/read-all`
- Definition of done: open a websocket as `alice`, post answer to her question as `bob`, observe the notification arriving on the socket within 1 second
- Owner: _unassigned_
- Status: ⏳

### Wire existing services as producers

#### S2-PROD-USER — User Service publishes events
- Depends on: S2-LIB-01, S1-USER-02
- Deliverable: emits `user.profile.updated` on profile patch, `user.followed` on follow/unfollow
- Definition of done: events visible in Kafka via `kafka-console-consumer`; envelope correct
- Owner: _unassigned_
- Status: ⏳

#### S2-PROD-TAG — Tag Service publishes events
- Depends on: S2-LIB-01, S1-TAG-02
- Deliverable: emits `tag.created` on creation, `tag.followed` on follow/unfollow
- Definition of done: same as above
- Owner: _unassigned_
- Status: ⏳

#### S2-PROD-Q — Question Service publishes events
- Depends on: S2-LIB-01, S1-QUESTION-02
- Deliverable: emits `question.created`, `question.updated`, `question.deleted`, `question.watched`, `question.closed`
- Definition of done: every state-changing endpoint produces exactly one event in the same logical action (use a transactional outbox pattern — see [risks-and-tradeoffs.md](risks-and-tradeoffs.md))
- Owner: _unassigned_
- Status: ⏳

#### S2-PROD-A — Answer Service publishes events
- Depends on: S2-LIB-01, S1-ANSWER-02
- Deliverable: emits `answer.created`, `answer.updated`, `answer.accepted`
- Definition of done: same as above
- Owner: _unassigned_
- Status: ⏳

#### S2-OUTBOX-01 — Transactional outbox pattern (shared)
- Depends on: S2-LIB-01, S0-REPO-03
- Deliverable: table template `outbox_events` (id, aggregate_type, aggregate_id, event_type, payload, created_at, published_at nullable) included in each producing service's migrations; background dispatcher publishes pending rows to Kafka and marks `published_at`. Implemented as a reusable NestJS module in `@devqa/kafka`.
- Definition of done: killing the service immediately after a DB commit and before Kafka ack still results in the event being published when the service restarts
- Owner: _unassigned_
- Status: ⏳

### Glue

#### S2-GW-01 — Move gateway rate-limit to Redis
- Depends on: S2-INFRA-01, S1-GW-01
- Deliverable: replace in-memory limiter with Redis-backed sliding-window limiter (per IP + per token)
- Definition of done: limit applied across multiple gateway replicas (verify by `docker compose up --scale api-gateway=2`)
- Owner: _unassigned_
- Status: ⏳

#### S2-COMPOSE-01 — Wire all Sprint 2 services into compose
- Depends on: S2-COMMENT-02, S2-VOTE-02, S2-NOTIF-03, S2-PROD-USER, S2-PROD-TAG, S2-PROD-Q, S2-PROD-A
- Deliverable: build contexts, env vars, Kafka brokers, Redis URL wired for new services; topic-init service runs before consumers start
- Definition of done: full Sprint 2 stack healthy under `docker compose up`
- Owner: _unassigned_
- Status: ⏳

#### S2-E2E-01 — Smoke E2E: ask → answer → notification
- Depends on: S2-COMPOSE-01
- Deliverable: `tests/e2e/sprint2.spec.ts`:
  1. `alice` watches her question
  2. `bob` posts an answer
  3. Assert: notification row exists for `alice` referencing `bob`'s answer
  4. Open websocket as `alice` first, then have `bob` post a second answer; assert socket receives the notification within 2s
  5. Vote on bob's answer twice with the same value → exactly one row, one event
- Definition of done: test green in CI; Kafka offsets advance; no duplicates after restart
- Owner: _unassigned_
- Status: ⏳

---

## Risks (Sprint 2 specific)

- **Dual-write hazard.** Writing to Postgres then publishing to Kafka in two separate steps drops events on crash. **S2-OUTBOX-01 is not optional** — every event-producing service must use it.
- **Notification spam from `vote.changed`.** Every vote = one event; naive fanout buries users. The recipient logic in S2-NOTIF-02 must filter to milestones.
- **Single-node websocket fanout.** Acceptable for class scope. Document Redis pub/sub upgrade path in [cross-cutting.md](cross-cutting.md).
- **Kafka consumer rebalances during local dev.** Use stable `groupId` per service; document that restarting a service may pause consumption for a few seconds.
