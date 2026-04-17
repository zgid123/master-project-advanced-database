# Sprint 0 — Foundation

> **Goal:** Make Sprint 1 possible. Repo, conventions, shared libs, infra wiring, and CI must exist before any business service is written.
> **Exit criteria:** `docker compose up` brings up Postgres, Keycloak, Kafka, Zookeeper, Redis, OpenSearch, MongoDB, MinIO, and observability containers (no app services yet). `pnpm install && pnpm -r build && pnpm -r test` passes locally and in CI on a hello-world service.

---

## Tasks

### S0-REPO-01 — Initialize pnpm workspace monorepo
- Depends on: —
- Deliverable:
  - `pnpm-workspace.yaml` covering `packages/services/*`, `packages/libs/*`, `packages/contracts/*`, `packages/tools/*`
  - Root `package.json` with `pnpm@9` engine, common scripts (`build`, `test`, `lint`, `typecheck`, `format`)
  - `.nvmrc` pinning Node 20 LTS
- Definition of done: `pnpm install` succeeds on a clean clone; `pnpm -r run build` is a no-op on empty packages
- Owner: _unassigned_
- Status: ⏳

### S0-REPO-02 — Root tooling (TS, lint, format, hooks)
- Depends on: S0-REPO-01
- Deliverable:
  - `tsconfig.base.json` (strict, ES2022, NodeNext)
  - ESLint config (`@typescript-eslint`, `eslint-config-prettier`, NestJS rules)
  - Prettier config + `.editorconfig`
  - Husky pre-commit running `lint-staged` (eslint --fix + prettier --write)
  - commitlint with conventional-commits config
- Definition of done: a deliberately bad commit message is rejected; a deliberately bad file is auto-fixed pre-commit
- Owner: _unassigned_
- Status: ⏳

### S0-REPO-03 — Decide and document migration tool
- Depends on: S0-REPO-01
- Deliverable: ADR file at `docs/adr/0001-migration-tool.md` choosing **TypeORM** vs **Prisma** vs **Knex** for relational migrations. Recommendation: **Prisma** (best DX in NestJS + per-service schema isolation), but team to confirm.
- Definition of done: ADR merged; rule applied uniformly in every Sprint 1 service
- Owner: _unassigned_
- Status: ⏳

### S0-INFRA-01 — Promote design compose to working compose
- Depends on: S0-REPO-01
- Deliverable:
  - Copy [../reference/docker-compose.microservices.design.yml](../reference/docker-compose.microservices.design.yml) → `docker-compose.yml` at repo root
  - Replace busybox app placeholders with build contexts (left commented until each service exists)
  - All infra services (Keycloak, Postgres, Mongo, Redis, Kafka, Zookeeper, OpenSearch, OpenSearch Dashboards, MinIO, otel-collector, Prometheus, Grafana, Jaeger) come up cleanly
- Definition of done: `docker compose up postgres-core keycloak kafka zookeeper redis opensearch mongo-feed minio` starts and stays healthy for 5 minutes
- Owner: _unassigned_
- Status: ⏳

### S0-INFRA-02 — Postgres init scripts (per-service logical DBs + users)
- Depends on: S0-INFRA-01
- Deliverable:
  - `infra/postgres/init/01-create-databases.sql` creating `keycloak_db`, `user_db`, `tag_db`, `question_db`, `answer_db`, `comment_db`, `vote_db`, `notification_db`, `moderation_db`, `media_db`
  - `infra/postgres/init/02-create-roles.sql` creating one DB user per service with strong random passwords (env-driven), each granted privileges on **only** its own database
  - Mounted into `postgres-core` via `./infra/postgres/init:/docker-entrypoint-initdb.d`
- Definition of done: `psql` as `user_service` can read/write `user_db` but is denied access to `question_db`
- Owner: _unassigned_
- Status: ⏳

### S0-INFRA-03 — Environment config (.env.example + secrets convention)
- Depends on: S0-INFRA-02
- Deliverable:
  - `.env.example` with every variable documented (DB users/passwords, Keycloak admin, MinIO credentials, Kafka brokers, OpenSearch URL, Redis URL, Mongo URL, OTEL endpoint)
  - `.env` git-ignored
  - `infra/secrets/README.md` explaining dev (env files) vs prod (Docker secrets / external secret manager) handling
- Definition of done: a fresh clone with `cp .env.example .env` and `docker compose up` starts cleanly
- Owner: _unassigned_
- Status: ⏳

### S0-LIB-01 — `@devqa/config` shared library
- Depends on: S0-REPO-02
- Deliverable: NestJS-compatible config module that loads env vars, validates them with **Zod**, and exposes a typed `AppConfig` token. Includes common blocks: `database`, `kafka`, `redis`, `auth`, `telemetry`, `service` (name, version, port).
- Definition of done: invalid env (e.g. missing `DATABASE_URL`) fails service boot with a clear error; happy-path test in CI
- Owner: _unassigned_
- Status: ⏳

### S0-LIB-02 — `@devqa/logger` shared library
- Depends on: S0-LIB-01
- Deliverable: pino-based NestJS logger module emitting JSON logs with fields: `traceId`, `spanId`, `correlationId`, `userId`, `service.name`, `service.version`. Pretty-prints in dev, JSON in prod.
- Definition of done: a log emitted from a request handler carries the request's traceId
- Owner: _unassigned_
- Status: ⏳

### S0-LIB-03 — `@devqa/auth` shared library
- Depends on: S0-LIB-01
- Deliverable: NestJS auth module with `@JwtAuth()` guard and `@Roles('moderator', 'admin')` decorator. Validates RS256 JWTs against Keycloak's JWKS endpoint (URL from config). Exposes `RequestUser` (sub, username, roles, email).
- Definition of done: a guarded route returns 401 without token, 403 without required role, 200 with valid moderator token
- Owner: _unassigned_
- Status: ⏳

### S0-LIB-04 — `@devqa/errors` shared library
- Depends on: S0-LIB-02
- Deliverable: shared error classes (`DomainError`, `NotFoundError`, `ConflictError`, `ValidationError`, `ExternalServiceError`), HTTP exception filter that maps them to consistent JSON `{ code, message, details, correlationId }` responses
- Definition of done: throwing `NotFoundError('user', id)` from any service produces identical 404 body shape
- Owner: _unassigned_
- Status: ⏳

### S0-LIB-05 — `@devqa/telemetry` shared library
- Depends on: S0-LIB-01
- Deliverable: OpenTelemetry SDK bootstrap (Node SDK + auto-instrumentations for HTTP, Postgres, Mongo, Redis, Kafka). OTLP exporter pointed at `otel-collector`. Adds `correlationId` from incoming `x-correlation-id` header (or generates one) and propagates it on outbound calls and Kafka headers.
- Definition of done: a request hitting service A → service B shows a single end-to-end trace in Jaeger with 2 spans
- Owner: _unassigned_
- Status: ⏳

### S0-LIB-06 — `@devqa/kafka` shared library
- Depends on: S0-LIB-01, S0-LIB-02, S0-LIB-05
- Deliverable: thin wrapper over **kafkajs** providing:
  - `KafkaProducer.publish<T>(topic, event: DomainEvent<T>)`
  - `@KafkaConsumer({ topic, groupId })` decorator + handler discovery
  - Standard envelope auto-fill (`eventId`, `occurredAt`, `producer`, `correlationId` from telemetry context)
  - Idempotency helper: `withIdempotency(eventId, handler)` backed by Redis SET NX
  - Dead-letter forwarding on repeated handler failure
- Definition of done: produce + consume round-trip test in Testcontainers Kafka; envelope fields populated automatically
- Owner: _unassigned_
- Status: ⏳

### S0-CONTRACTS-01 — Event payload contracts package
- Depends on: S0-LIB-06
- Deliverable: `packages/contracts/events` exporting TypeScript types for every Kafka topic in HLD §8 (`user.profile.updated`, `tag.created`, `tag.followed`, `question.created`, `question.updated`, `question.deleted`, `question.watched`, `question.closed`, `answer.created`, `answer.updated`, `answer.accepted`, `comment.created`, `vote.changed`, `user.followed`, `notification.requested`, `media.uploaded`, `moderation.action.created`). Each topic has a versioned schema (`v1`).
- Definition of done: types compile in isolation; all sprint services import from `@devqa/contracts/events` rather than redefining shapes
- Owner: _unassigned_
- Status: ⏳

### S0-CONTRACTS-02 — Shared DTOs and HTTP envelopes
- Depends on: S0-REPO-02
- Deliverable: `packages/contracts/dto` with shared HTTP request/response shapes (pagination, error envelope, common id/timestamp types)
- Definition of done: every sprint service consumes `Paginated<T>` from the contracts package
- Owner: _unassigned_
- Status: ⏳

### S0-CI-01 — GitHub Actions baseline
- Depends on: S0-REPO-02
- Deliverable: `.github/workflows/ci.yml` running on PR and push to `main`:
  - install (cached pnpm store)
  - `pnpm -r lint`
  - `pnpm -r typecheck`
  - `pnpm -r test`
- Definition of done: CI passes on a hello-world service; failing test fails the job
- Owner: _unassigned_
- Status: ⏳

### S0-CI-02 — Image build workflow (per service, on tag)
- Depends on: S0-CI-01
- Deliverable: workflow that builds Docker images for any service that exposes a `Dockerfile`, tagged as `ghcr.io/<org>/devqa-<service>:<git-sha>` on push to `main`
- Definition of done: pushing to main publishes images for every service that exists; no-op for services not yet scaffolded
- Owner: _unassigned_
- Status: ⏳

### S0-DOCS-01 — Root README + one-command bring-up
- Depends on: S0-INFRA-03, S0-CI-01
- Deliverable: `README.md` with prerequisites (Docker, Node 20, pnpm 9), `git clone → cp .env.example .env → docker compose up -d → pnpm install` quick-start, links to [PLAN.md](../PLAN.md)
- Definition of done: a teammate can follow the README on a clean machine and reach a running infra stack in under 15 minutes
- Owner: _unassigned_
- Status: ⏳

---

## Risks (Sprint 0 specific)

- **Local resource footprint.** Postgres + Kafka + Zookeeper + OpenSearch + Mongo + Keycloak + MinIO + observability stack is heavy. Allocate ≥ 8 GB RAM to Docker. Document in README.
- **Migration tool lock-in.** S0-REPO-03 picks once for the whole repo; switching mid-project is expensive.
- **Keycloak first-boot cost.** Realm/role seeding should be scripted (S1-KC-02) so devs don't lose 20 minutes per machine.
