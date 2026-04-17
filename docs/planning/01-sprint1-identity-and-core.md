# Sprint 1 — Identity + Core Write Services

> **Goal:** Establish identity, edge, and the foundational write-side domain services so a user can register, ask a question, post an answer, and accept an answer end-to-end (synchronous only — events are introduced in Sprint 2).
> **Exit criteria:** Smoke E2E `register → login → ask → answer → accept` passes against the docker-compose stack.

Mirrors HLD §18 Sprint 1.

---

## Scope (services delivered in this sprint)

- Keycloak realm + roles + seed users
- API Gateway (NestJS)
- Web BFF (NestJS — placeholder aggregation)
- User Service
- Tag Service
- Question Service
- Answer Service

> Comment, Vote, Notification, Search, Feed, Media, Moderation come in later sprints.

---

## Common Definition of Done (every service in this sprint)

- Migration runs cleanly via the chosen migration tool (per [S0-REPO-03](00-foundation.md#s0-repo-03--decide-and-document-migration-tool))
- REST contract documented as OpenAPI under `apps/<service>/openapi.yaml` and served at `/docs`
- Unit tests + integration tests (Testcontainers Postgres) green
- `Dockerfile` builds; container starts under `docker compose up <service>`
- Health probes `/health/live`, `/health/ready`, metrics `/metrics`
- Service uses **its own** Postgres user with grants only on **its own** database (per [S0-INFRA-02](00-foundation.md#s0-infra-02--postgres-init-scripts-per-service-logical-dbs--users))
- Service code lives at `packages/services/<service>/`; uses shared libs from `@devqa/*`

---

## Tasks

### Identity layer

#### S1-KC-01 — Boot Keycloak with `keycloak_db`

- Depends on: S0-INFRA-01, S0-INFRA-02
- Deliverable: Keycloak 26 connected to Postgres via `KC_DB_URL=jdbc:postgresql://postgres-core:5432/keycloak_db` with its own DB user
- Definition of done: Keycloak admin console reachable on `http://localhost:8081`; database survives container restart
- Owner: _unassigned_
- Status: ⏳

#### S1-KC-02 — `devqa` realm + roles + seed users (scripted)

- Depends on: S1-KC-01
- Deliverable:
  - `infra/keycloak/realm-export.json` defining the `devqa` realm, public client `devqa-web`, confidential client `devqa-bff`, roles `user` / `moderator` / `admin`
  - Imported automatically via `KC_IMPORT` or a sidecar init script
  - Seed users: `alice` (user), `bob` (user), `mod1` (moderator), `admin1` (admin) — passwords from env
- Definition of done: token issuance succeeds for each seed user via `POST /realms/devqa/protocol/openid-connect/token`
- Owner: _unassigned_
- Status: ⏳

### Edge layer

#### S1-GW-01 — API Gateway service (NestJS)

- Depends on: S1-KC-02, S0-LIB-03, S0-LIB-05
- Deliverable: `packages/services/api-gateway` exposing port 8080 with:
  - JWT validation against Keycloak JWKS
  - Route registry (config-driven) forwarding `/api/users/*` → user-service, etc.
  - Request-id propagation (`x-correlation-id`)
  - CORS for the web origin
  - Rate limiting (in-memory in Sprint 1; Redis-backed in Sprint 2 via [S2-INFRA-01](02-sprint2-interactions-and-events.md#s2-infra-01--redis-wired-to-services))
- Definition of done: unauthenticated `/api/users/me` returns 401; authenticated returns the BFF's response with the correlation id echoed
- Owner: _unassigned_
- Status: ⏳

#### S1-BFF-01 — Web BFF skeleton

- Depends on: S1-GW-01
- Deliverable: `packages/services/web-bff` with placeholder aggregation endpoints:
  - `GET /api/me` — joins User Service profile + Tag Service follow list
  - `GET /api/questions/:id/page` — joins Question Service + Answer Service (read-only fan-out)
- Definition of done: aggregation returns merged JSON; failures in any downstream return partial response with error markers
- Owner: _unassigned_
- Status: ⏳

### Domain services

#### S1-USER-01 — User Service schema + migrations

- Depends on: S0-INFRA-02, S0-REPO-03
- Deliverable: tables `users` (id, keycloak_sub, username, email, created_at), `profiles` (user_id, display_name, bio, avatar_url, reputation), `user_followers` (follower_id, followee_id, created_at) with appropriate indexes
- Definition of done: migration runs in CI; ER diagram committed under `packages/services/user-service/docs/`
- Owner: _unassigned_
- Status: ⏳

#### S1-USER-02 — User Service API (CRUD + public profile)

- Depends on: S1-USER-01, S0-LIB-03, S0-LIB-04
- Deliverable:
  - `POST /users` (called from a Keycloak event-listener or first-login hook to provision local profile)
  - `GET /users/:id` (public)
  - `GET /users/me` (authenticated)
  - `PATCH /users/me` (authenticated)
  - `POST /users/:id/follow`, `DELETE /users/:id/follow`
- Definition of done: integration tests cover happy path + 401/403/404; OpenAPI spec served at `/docs`
- Owner: _unassigned_
- Status: ⏳

#### S1-TAG-01 — Tag Service schema + migrations

- Depends on: S0-INFRA-02, S0-REPO-03
- Deliverable: tables `tags` (id, slug, name, description, created_at), `tag_aliases` (tag_id, alias), `user_tag_subscriptions` (user_id, tag_id, created_at). Indexes: unique `(slug)`, unique `(user_id, tag_id)`
- Definition of done: migration runs; seed script loads ~30 starter tags (`javascript`, `typescript`, `nestjs`, `postgres`, `redis`, `kafka`, `opensearch`, `docker`, `mongodb`, etc.)
- Owner: _unassigned_
- Status: ⏳

#### S1-TAG-02 — Tag Service API

- Depends on: S1-TAG-01, S0-LIB-03
- Deliverable:
  - `GET /tags` (search by prefix, paginated)
  - `GET /tags/:slug`
  - `POST /tags` (moderator+)
  - `POST /tags/:slug/follow`, `DELETE /tags/:slug/follow`
  - `GET /users/me/tags` — followed tags for the authenticated user
- Definition of done: prefix search returns results in < 50 ms with seeded data; all endpoints integration-tested
- Owner: _unassigned_
- Status: ⏳

#### S1-QUESTION-01 — Question Service schema + migrations

- Depends on: S0-INFRA-02, S0-REPO-03
- Deliverable: tables `questions` (id, author_id, title, body_md, status enum [open|closed|deleted], created_at, updated_at), `question_tags` (question_id, tag_id), `question_watchers` (question_id, user_id, created_at). Indexes on `(author_id)`, `(status, created_at desc)`, `(question_id)` in junction tables.
- Definition of done: migration runs; FK to tags is **logical only** (tag_id is a uuid; cross-service joins are forbidden — see [cross-cutting.md](cross-cutting.md))
- Owner: _unassigned_
- Status: ⏳

#### S1-QUESTION-02 — Question Service API

- Depends on: S1-QUESTION-01, S0-LIB-03, S0-LIB-04
- Deliverable:
  - `POST /questions` — body `{ title, body, tagSlugs[] }`. Validates tag existence by calling Tag Service `GET /tags?slugs=...` (sync HTTP call; no events yet)
  - `GET /questions/:id`
  - `PATCH /questions/:id` — author only, increments `updated_at`
  - `DELETE /questions/:id` — soft delete (status → `deleted`)
  - `POST /questions/:id/watch`, `DELETE /questions/:id/watch`
  - `GET /questions?authorId=...&tagSlug=...&status=...` (basic listing — full search comes in Sprint 3)
- Definition of done: ask-question E2E green; tag validation rejects unknown tags with 422
- Owner: _unassigned_
- Status: ⏳

#### S1-ANSWER-01 — Answer Service schema + migrations

- Depends on: S0-INFRA-02, S0-REPO-03
- Deliverable: tables `answers` (id, question_id, author_id, body_md, status enum [active|deleted], created_at, updated_at, accepted_at nullable), `accepted_answer_audit` (question_id, accepted_answer_id, accepted_by_user_id, accepted_at). Indexes on `(question_id, status)`, unique `(question_id) where accepted_at is not null` (partial unique).
- Definition of done: migration runs; partial-unique constraint prevents two accepted answers per question
- Owner: _unassigned_
- Status: ⏳

#### S1-ANSWER-02 — Answer Service API

- Depends on: S1-ANSWER-01, S1-QUESTION-02, S0-LIB-03
- Deliverable:
  - `POST /questions/:questionId/answers` — body `{ body }`. Validates question exists + is `open` via Question Service sync call
  - `GET /questions/:questionId/answers` — paginated, accepted-first
  - `PATCH /answers/:id` — author only
  - `DELETE /answers/:id` — soft delete
  - `POST /questions/:questionId/answers/:id/accept` — authorization: caller must be question author (verified via Question Service); transactionally updates `accepted_at` + writes audit row
- Definition of done: accept-answer E2E green; trying to accept twice or as non-owner returns 409/403
- Owner: _unassigned_
- Status: ⏳

### Compose + glue

#### S1-COMPOSE-01 — Wire all Sprint 1 services into compose

- Depends on: S1-GW-01, S1-BFF-01, S1-USER-02, S1-TAG-02, S1-QUESTION-02, S1-ANSWER-02
- Deliverable: each service has a build context in `docker-compose.yml`, env vars wired, depends_on set, joined to the right networks (`edge-net`, `app-net`, `data-net`, `observability-net`)
- Definition of done: `docker compose up` brings the full Sprint 1 stack to healthy in < 90 seconds
- Owner: _unassigned_
- Status: ⏳

#### S1-E2E-01 — Smoke E2E: register → ask → answer → accept

- Depends on: S1-COMPOSE-01
- Deliverable: `tests/e2e/sprint1.spec.ts` (Jest + supertest) that:
  1. Logs in `alice` via Keycloak
  2. Provisions her local profile via User Service
  3. Follows tag `nestjs`
  4. Asks question tagged `nestjs`
  5. Logs in `bob`, answers
  6. As `alice`, accepts `bob`'s answer
  7. Asserts question detail shows accepted answer
- Definition of done: test green in CI against the compose stack
- Owner: _unassigned_
- Status: ⏳

---

## Risks (Sprint 1 specific)

- **Sync HTTP calls between services** (Question → Tag, Answer → Question) introduce coupling. Acceptable for Sprint 1 because the event backbone is not yet up — Sprint 2 introduces events but these sync validations stay (cheap, low blast radius).
- **Profile bootstrap on first login.** Decide between (a) Keycloak event listener that POSTs to User Service, or (b) lazy provisioning on first authenticated request to BFF. Pick one and document in S1-USER-02.
- **Partial unique index for accepted answer.** Verify your chosen migration tool can express `where accepted_at is not null`; fall back to a raw SQL migration if not.
