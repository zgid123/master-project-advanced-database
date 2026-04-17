# DevQ&A — Implementation Plan (Master Tracker)

> Master tracker for delivering the DevQ&A / StackIt platform.
> Source of truth for the architecture: [reference/devqa_microservices_hld.md](reference/devqa_microservices_hld.md).
> Source of truth for runtime topology: [reference/docker-compose.microservices.design.yml](reference/docker-compose.microservices.design.yml).

---

## 1. Project Summary

DevQ&A is a microservices-first technical Q&A platform combining **Stack Overflow** style knowledge mechanics (questions, answers, votes, accepted answer, tags) with **Reddit** style browsing (personalized feed, follow tags/users, watched questions). The platform is built as event-driven microservices with database-per-service ownership, dedicated search (OpenSearch), denormalized feed read-models (MongoDB), and Keycloak for identity.

This document set breaks the HLD into actionable sprint plans. The architecture is fixed; the execution is sprint-by-sprint to control delivery risk.

---

## 2. Architecture Snapshot

| # | Service | Owns | Datastore |
|---|---|---|---|
| 1 | Keycloak | Identity, OAuth2/OIDC, roles | PostgreSQL (`keycloak_db`) |
| 2 | API Gateway | Edge routing, JWT validation, rate limit | — (stateless) |
| 3 | Web BFF | Frontend aggregation | — (stateless) |
| 4 | User Service | Profiles, follow-user | PostgreSQL (`user_db`) |
| 5 | Tag Service | Tag catalog, follow-tag | PostgreSQL (`tag_db`) |
| 6 | Question Service | Questions, watchers | PostgreSQL (`question_db`) |
| 7 | Answer Service | Answers, accepted state | PostgreSQL (`answer_db`) |
| 8 | Comment Service | Comments | PostgreSQL (`comment_db`) |
| 9 | Vote Service | Votes (idempotent) | PostgreSQL (`vote_db`) |
| 10 | Notification Service | Notifications + realtime fanout | PostgreSQL (`notification_db`) + Redis |
| 11 | Search Service | Search query API | OpenSearch (read) |
| 12 | Indexer Service | Build search documents from events | OpenSearch (write) |
| 13 | Feed Service | Home/tag feed read API | MongoDB (`feed_read_db`) + Redis |
| 14 | Feed Projector Service | Materialize feed documents from events | MongoDB (`feed_read_db`) |
| 15 | Media Service | Attachment metadata + objects | PostgreSQL (`media_db`) + MinIO |
| 16 | Moderation Service | Reports, close/reopen, audit | PostgreSQL (`moderation_db`) |

Async backbone: **Kafka** (domain events). Cache + ephemeral state: **Redis**. Object storage: **MinIO**. Observability: **OpenTelemetry → Jaeger / Prometheus → Grafana**.

---

## 3. Tech Stack Decisions

| Concern | Choice |
|---|---|
| Language / Runtime | **Node.js 20 LTS** + **TypeScript 5.x** |
| Application framework | **NestJS 10** (per service) |
| Monorepo tooling | **pnpm workspaces** |
| Relational DB | **PostgreSQL 16** (one server, logical DB per service, separate DB users) |
| Document DB | **MongoDB 8** (feed read model only) |
| Cache / ephemeral | **Redis 7** |
| Event bus | **Apache Kafka 3.7** (Bitnami image, Zookeeper for now) |
| Search | **OpenSearch 2.19** + Dashboards |
| Identity | **Keycloak 26** |
| Object storage | **MinIO** (S3-compatible) |
| API Gateway | **NestJS-based gateway** (recommended for stack consistency; Kong remains a fallback) |
| Telemetry | OpenTelemetry SDK → otel-collector → Jaeger (traces), Prometheus (metrics), Grafana (dashboards) |
| Container | Docker + Docker Compose for local; Kubernetes is post-class scope |
| Testing | Jest (unit), Testcontainers (integration), compose-based E2E |
| Migrations | Decision deferred to [00-foundation.md](planning/00-foundation.md) (TypeORM vs Prisma vs Knex) |

---

## 4. Sprint Roadmap

| Sprint | Theme | Services delivered | Detail | Status |
|---|---|---|---|---|
| 0 | Foundation / pre-work | Monorepo, shared libs, infra wiring, CI | [00-foundation.md](planning/00-foundation.md) | ⏳ Not started |
| 1 | Identity + core write services | Keycloak, Gateway, BFF, User, Tag, Question, Answer | [01-sprint1-identity-and-core.md](planning/01-sprint1-identity-and-core.md) | ⏳ Not started |
| 2 | Interactions + async backbone | Comment, Vote, Notification, Redis, Kafka, event publishers | [02-sprint2-interactions-and-events.md](planning/02-sprint2-interactions-and-events.md) | ⏳ Not started |
| 3 | Read-side projections | OpenSearch, Indexer, Search, MongoDB, Feed Projector, Feed | [03-sprint3-search-and-feed.md](planning/03-sprint3-search-and-feed.md) | ⏳ Not started |
| 4 | Phase-2 services + hardening | Media + MinIO, Moderation, full Observability stack, perf, demo | [04-sprint4-moderation-media-and-hardening.md](planning/04-sprint4-moderation-media-and-hardening.md) | ⏳ Not started |

Status legend: ⏳ Not started · 🟡 In progress · ✅ Done · ⛔ Blocked

---

## 5. Cross-Cutting Concerns

These apply across every sprint and live in their own document:

- **[planning/cross-cutting.md](planning/cross-cutting.md)** — repo layout, NestJS service template, config, auth, logging, tracing/metrics, error model, event envelope, testing, CI, branching/PR convention.
- **[planning/risks-and-tradeoffs.md](planning/risks-and-tradeoffs.md)** — known risks (event-schema drift, saga partial failure, local-dev resource footprint) with mitigations.

---

## 6. Task ID Convention

Every task in a detail file is identified as `S<sprint>-<area>-<seq>`, e.g. `S1-USER-03`, `S3-FEED-02`. Each task includes:

```
### S<n>-<AREA>-<seq> — Short imperative title
- Depends on: <list of task IDs>
- Deliverable: <files / endpoints / dashboards / etc.>
- Definition of done: <observable, test-backed criteria>
- Owner: <name | _unassigned_>
- Status: ⏳ | 🟡 | ✅ | ⛔
```

Reference task IDs in commit messages and PR titles, e.g.:

```
S2-VOTE-04: idempotent vote transition + unique index on (user_id, target_id, target_type)
```

---

## 7. How to Use This Doc Set

1. Open the relevant sprint detail file before starting work.
2. Move a task to 🟡 In progress when picked up; assign yourself as Owner.
3. Open a PR titled with the task ID. Link the PR back into the sprint file's status column.
4. Mark ✅ Done only when the Definition of done items are all satisfied (tests pass, docs updated, container starts under compose).
5. New work discovered mid-sprint: append a new task with the next available `<seq>` number; never renumber existing tasks.
6. Cross-sprint blockers: leave a `⛔` marker and add a note in [planning/risks-and-tradeoffs.md](planning/risks-and-tradeoffs.md).
7. When a sprint completes, update the status column in §4 above.

---

## 8. Reference Material

- [reference/devqa_microservices_hld.md](reference/devqa_microservices_hld.md) — full HLD (frozen baseline)
- [reference/docker-compose.microservices.design.yml](reference/docker-compose.microservices.design.yml) — design-only compose (frozen baseline; Sprint 0 promotes a working copy to repo root)
