# Cross-Cutting Concerns

These rules apply to every service in every sprint. Sprint files reference this document by name.

---

## 1. Repo Layout (pnpm workspace)

```
master-project-advanced-database/
├── docker-compose.yml                 # working compose (created in S0-INFRA-01)
├── .env.example
├── README.md
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── packages/
│   ├── services/
│   │   ├── api-gateway/
│   │   ├── web-bff/
│   │   ├── user-service/
│   │   ├── tag-service/
│   │   ├── question-service/
│   │   ├── answer-service/
│   │   ├── comment-service/
│   │   ├── vote-service/
│   │   ├── notification-service/
│   │   ├── search-service/
│   │   ├── indexer-service/
│   │   ├── feed-service/
│   │   ├── feed-projector-service/
│   │   ├── media-service/
│   │   └── moderation-service/
│   ├── libs/
│   │   ├── config/                    # @devqa/config
│   │   ├── logger/                    # @devqa/logger
│   │   ├── auth/                      # @devqa/auth
│   │   ├── errors/                    # @devqa/errors
│   │   ├── telemetry/                 # @devqa/telemetry
│   │   └── kafka/                     # @devqa/kafka
│   ├── contracts/
│   │   ├── events/                    # @devqa/contracts/events
│   │   └── dto/                       # @devqa/contracts/dto
│   └── tools/
│       ├── seed/                      # S4-PERF-01
│       └── load/                      # S4-PERF-01
├── infra/
│   ├── postgres/init/                 # S0-INFRA-02
│   ├── keycloak/                      # S1-KC-02
│   ├── kafka/                         # S2-INFRA-02
│   ├── opensearch/                    # S3-OS-02
│   ├── otel/                          # S4-OBS-01
│   ├── prometheus/                    # S4-OBS-02
│   ├── grafana/provisioning/          # S4-OBS-03
│   └── secrets/
├── tests/
│   └── e2e/                           # cross-service E2E suites
└── docs/
    ├── PLAN.md                        # master tracker
    ├── planning/                      # this folder
    ├── reference/                     # frozen HLD + design compose
    ├── adr/                           # architecture decision records
    ├── security/
    ├── perf/
    └── demo/
```

---

## 2. Service Template (NestJS)

Every service under `packages/services/<name>/` looks like:

```
<name>/
├── package.json                       # depends on @devqa/* libs
├── tsconfig.json                      # extends ../../../tsconfig.base.json
├── Dockerfile
├── openapi.yaml                       # generated from controllers
├── prisma/ (or migrations/)           # per S0-REPO-03 decision
├── src/
│   ├── main.ts                        # boot: telemetry → config → app
│   ├── app.module.ts
│   ├── api/                           # controllers + DTOs
│   ├── domain/                        # entities, services, ports
│   ├── infra/                         # repositories, adapters
│   ├── events/                        # producers + consumers
│   └── config/                        # service-specific config schema
├── test/
│   ├── unit/
│   └── integration/
└── docs/
    └── erd.md                         # ER diagram for owned tables
```

Boot order in `main.ts`:

1. `@devqa/telemetry` initializes OpenTelemetry SDK (must be first import)
2. `@devqa/config` validates env via Zod
3. NestJS `app.create()`
4. Global `@devqa/errors` exception filter
5. Global `@devqa/auth` guard (default: anonymous; routes opt in to `@JwtAuth()`)
6. Health endpoints `/health/live`, `/health/ready` (terminus)
7. Prometheus metrics at `/metrics`

---

## 3. Config (`@devqa/config`)

- 12-factor: every config value comes from env
- Validated with **Zod** at boot; invalid env crashes the process with a clear error
- Common blocks reused across services: `database`, `kafka`, `redis`, `auth`, `telemetry`, `service`
- Service-specific config extends the common schema

---

## 4. Auth (`@devqa/auth`)

- Validates RS256 JWTs against Keycloak's JWKS endpoint
- Caches JWKS keys in-memory with periodic refresh
- Provides `@JwtAuth()` guard, `@Roles(...)` decorator, `@CurrentUser()` param decorator
- `RequestUser` shape: `{ sub, username, email, roles[] }`
- Trust model: gateway validates and forwards JWT untouched; downstream services revalidate (cheap; defense in depth)

---

## 5. Logging (`@devqa/logger`)

- pino-based, JSON in prod, pretty in dev
- Standard fields on every log line: `traceId`, `spanId`, `correlationId`, `userId` (when known), `service.name`, `service.version`
- Request lifecycle logger logs request start/end with method, path, status, duration
- Never log secrets, JWTs, or full request bodies

---

## 6. Tracing & Metrics (`@devqa/telemetry`)

- OpenTelemetry Node SDK + auto-instrumentations: HTTP, Postgres, Mongo, Redis, kafkajs
- OTLP exporter to `otel-collector` (gRPC by default)
- Correlation ID:
  - Read from incoming `x-correlation-id` header; generate (uuid) if absent
  - Propagate on outbound HTTP via header
  - Propagate on Kafka producer via headers; consumer extracts and re-installs into context
- Standard custom metrics declared in [04-sprint4-moderation-media-and-hardening.md S4-OBS-04](04-sprint4-moderation-media-and-hardening.md#s4-obs-04--standard-service-metrics--log-fields)

---

## 7. Errors (`@devqa/errors`)

Error classes:

- `DomainError` (base)
- `NotFoundError(resource, id)` → 404
- `ConflictError(message, details?)` → 409
- `ValidationError(message, fieldErrors)` → 422
- `UnauthorizedError(message)` → 401
- `ForbiddenError(message)` → 403
- `ExternalServiceError(service, cause)` → 502

Global exception filter maps to:

```json
{
  "code": "NOT_FOUND",
  "message": "User abc123 not found",
  "details": { "resource": "user", "id": "abc123" },
  "correlationId": "..."
}
```

Never leak stack traces in non-dev environments.

---

## 8. Event Envelope (`@devqa/contracts/events`)

Every Kafka event uses the same envelope (HLD §8):

```ts
type DomainEvent<TPayload> = {
  eventId: string; // uuid v4, generated by producer
  eventType: string; // e.g. 'question.created'
  schemaVersion: 'v1';
  occurredAt: string; // ISO8601 UTC
  producer: string; // service.name
  aggregateType: string; // e.g. 'question'
  aggregateId: string; // uuid
  actorUserId: string | null;
  correlationId: string; // from telemetry context
  payload: TPayload; // strongly typed per topic
};
```

Rules:

- **Versioning:** never break a `v1` schema. New required fields → introduce `v2` topic + dual-publish + migrate consumers.
- **Idempotency:** consumers must dedupe on `eventId`. Use `withIdempotency` from `@devqa/kafka` (Redis SET NX with TTL).
- **Ordering:** partition key = `aggregateId` so events for the same aggregate land on the same partition in order.
- **Producing:** events are written via the **transactional outbox** ([S2-OUTBOX-01](02-sprint2-interactions-and-events.md#s2-outbox-01--transactional-outbox-pattern-shared)) — never publish directly from a request handler.

---

## 9. Database-Per-Service Discipline

- One Postgres server, **N logical databases**, **N DB users** with grants only on their own database
- `tag_id`, `user_id`, `question_id` etc. crossing service boundaries are **logical foreign keys only** — no DB-level FK constraints across schemas
- Cross-service reads happen via **API call** (sync, when low-volume and tolerable latency) or **event subscription** (async, when read-heavy or denormalization is desired)
- Direct cross-service `SELECT` is **prohibited** even though Postgres allows it physically — code review must reject it

---

## 10. Testing

| Layer                            | Tool                      | Where                                      |
| -------------------------------- | ------------------------- | ------------------------------------------ |
| Unit                             | Jest                      | per service `test/unit/`                   |
| Integration (DB / Redis / Kafka) | Jest + **Testcontainers** | per service `test/integration/`            |
| E2E (multi-service via compose)  | Jest + supertest + ws     | repo root `tests/e2e/`                     |
| Contract (event schemas)         | Zod / type-only           | `packages/contracts/events` snapshot tests |
| Load                             | k6 (or Artillery)         | `packages/tools/load`                      |

Coverage target: **70%+** lines, but coverage is a smoke signal, not a goal — focus on critical-path behaviors.

---

## 11. CI

GitHub Actions workflow ([S0-CI-01](00-foundation.md#s0-ci-01--github-actions-baseline) → extended in [S4-SEC-02](04-sprint4-moderation-media-and-hardening.md#s4-sec-02--dependency--image-scanning-in-ci)):

```
lint → typecheck → unit tests → integration tests → image build → image scan
```

E2E suite runs on PRs touching multiple services and on main, on a self-hosted runner with Docker.

---

## 12. Branching, PRs, Commits

- Branch: `s<sprint>/<area>/<short-desc>` e.g. `s2/vote/idempotent-transitions`
- Commit subject: `<TASK-ID>: <imperative summary>` e.g. `S2-VOTE-04: enforce one-vote-per-target via partial unique index`
- PR title: `<TASK-ID> — <human title>`; PR body links the task line in the relevant sprint file
- Squash-merge to `main`; main is always green

---

## 13. Future / Out-of-class-scope Notes

These show up in HLD §15 (deployment evolution) and don't block delivery, but pin them here so they're visible:

- Kubernetes deployment + autoscaling
- Managed Kafka / OpenSearch / Postgres / Mongo
- Service mesh for mTLS and finer traffic policies
- Multi-node websocket fanout via Redis pub/sub channel `notification:fanout`
- ClamAV (or equivalent) plugged into `VirusScanner` interface
- ML-based feed ranking replacing the deterministic formula
