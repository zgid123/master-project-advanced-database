# Sprint 4 — Phase-2 Services + Hardening

> **Goal:** Deliver Media + Moderation services, complete the Observability stack, perform a security + performance hardening pass, and prepare the demo.
> **Exit criteria:** Full HLD service set is up; all standard dashboards populated; demo scenario script runs end-to-end on a clean machine.

Mirrors HLD §18 Sprint 4.

---

## Scope (services delivered in this sprint)

- Media Service + MinIO buckets
- Moderation Service
- Full observability stack (otel-collector, Prometheus, Grafana, Jaeger) wired into every service
- Security hardening
- Performance baseline
- Demo deliverables

---

## Tasks

### Media

#### S4-MINIO-01 — MinIO buckets + policies

- Depends on: S0-INFRA-01
- Deliverable:
  - MinIO healthy (already in compose); `mc` init container creates buckets `media-uploads` (private), `media-public` (read-only public for avatars)
  - Bucket policies enforce private-by-default; signed URLs required for `media-uploads` reads
- Definition of done: anonymous GET on `media-uploads/*` returns 403; signed URL works
- Owner: _unassigned_
- Status: ⏳

#### S4-MEDIA-01 — Media Service schema + migrations

- Depends on: S0-INFRA-02, S0-REPO-03
- Deliverable: table `media_metadata` (id, owner_user_id, bucket, object_key, content_type, size_bytes, sha256, status enum [pending|scanned|rejected], scan_result jsonb nullable, created_at). Indexes on `(owner_user_id)`, `(sha256)` for dedup.
- Definition of done: migration runs
- Owner: _unassigned_
- Status: ⏳

#### S4-MEDIA-02 — Media Service API + signed URLs

- Depends on: S4-MEDIA-01, S4-MINIO-01, S0-LIB-03, S2-LIB-01
- Deliverable:
  - `POST /media/uploads` { contentType, size } → returns presigned PUT URL + `mediaId`; row inserted with `status=pending`
  - `POST /media/uploads/:mediaId/complete` — client calls after upload; service HEADs the object, fills `size_bytes`/`sha256`, sets `status=scanned` (virus-scan stub returns clean for now), publishes `media.uploaded`
  - `GET /media/:id` → returns short-lived signed GET URL (or 403 if not authorized)
  - Authorization: only owner can complete; read access via signed URL only
- Definition of done: full upload → complete → fetch round trip works through gateway
- Owner: _unassigned_
- Status: ⏳

#### S4-MEDIA-03 — Virus-scan hook stub

- Depends on: S4-MEDIA-02
- Deliverable: pluggable interface `VirusScanner.scan(objectRef): Promise<ScanResult>`; default `NoopScanner` returns clean and is logged. Document where ClamAV (or equivalent) would plug in.
- Definition of done: interface exists; switching implementations is a one-line change
- Owner: _unassigned_
- Status: ⏳

### Moderation

#### S4-MOD-01 — Moderation Service schema + migrations

- Depends on: S0-INFRA-02, S0-REPO-03
- Deliverable: tables `reports` (id, reporter_user_id, target_type enum [question|answer|comment|user], target_id, reason enum, details, status enum [open|resolved|dismissed], created_at, resolved_at nullable, resolved_by_user_id nullable), `moderation_actions` (id, moderator_user_id, action enum [close|reopen|delete|undelete|warn|ban], target_type, target_id, reason, created_at). Indexes on `(status, created_at)`, `(target_type, target_id)`.
- Definition of done: migration runs
- Owner: _unassigned_
- Status: ⏳

#### S4-MOD-02 — Moderation API + role gating

- Depends on: S4-MOD-01, S0-LIB-03
- Deliverable:
  - `POST /reports` (any authenticated user)
  - `GET /reports?status=open` (moderator+)
  - `POST /reports/:id/resolve` { action: 'dismiss' | 'apply' } (moderator+)
  - `POST /moderation/actions` { action, targetType, targetId, reason } (moderator+) → records action and triggers downstream behavior:
    - `close` on a question → calls Question Service `/questions/:id/close` (or publishes a command — pick one and document)
    - `delete` on an answer → calls Answer Service `/answers/:id` DELETE
  - Publishes `moderation.action.created` for every action
- Definition of done: non-moderator gets 403 on moderator endpoints; closing a question via Moderation API results in the question's status changing in `question_db`
- Owner: _unassigned_
- Status: ⏳

#### S4-MOD-03 — Indexer + Feed Projector consume `moderation.action.created`

- Depends on: S4-MOD-02, S3-INDEXER-01, S3-FEEDPROJ-01
- Deliverable:
  - Indexer: on `delete` action, removes the document (or sets `status: deleted` and the search query already filters it out)
  - Feed Projector: on `delete`/`close` action, sets `visible: false` on relevant feed items so they disappear from feeds
- Definition of done: a moderator delete makes the content vanish from search and feed within 3s
- Owner: _unassigned_
- Status: ⏳

### Observability

#### S4-OBS-01 — otel-collector configured

- Depends on: S0-LIB-05, S0-INFRA-01
- Deliverable: `infra/otel/collector-config.yaml` with OTLP gRPC receiver, processors (batch, memory_limiter), exporters (Jaeger for traces, Prometheus for metrics, file/stdout for logs in dev). Mounted into the `otel-collector` container.
- Definition of done: traces emitted by any service appear in Jaeger; metrics scraped by Prometheus
- Owner: _unassigned_
- Status: ⏳

#### S4-OBS-02 — Prometheus scrape config

- Depends on: S4-OBS-01
- Deliverable: `infra/prometheus/prometheus.yml` scraping `/metrics` on every NestJS service (static targets in dev) and otel-collector's exposed Prometheus endpoint
- Definition of done: every service appears in `Targets` as `up`; service-emitted custom metrics visible in PromQL
- Owner: _unassigned_
- Status: ⏳

#### S4-OBS-03 — Grafana dashboards (provisioned)

- Depends on: S4-OBS-02
- Deliverable: `infra/grafana/provisioning/datasources/` (Prometheus + Jaeger) and `infra/grafana/provisioning/dashboards/` with JSON dashboards for HLD §14:
  - `api-latency.json` — p50/p95/p99 latency by service + endpoint
  - `kafka-consumer-lag.json` — lag per consumer group + topic
  - `opensearch-query-latency.json` — Search Service query times
  - `feed-projector-delay.json` — event-to-projection delay
  - `notification-delivery.json` — delivered/failed/skipped counters
  - `db-pool-saturation.json` — Postgres pool gauges per service
  - `cache-hit-ratio.json` — Redis cache hits vs misses by namespace
- Definition of done: dashboards auto-load on Grafana boot; show real data after running E2E suite
- Owner: _unassigned_
- Status: ⏳

#### S4-OBS-04 — Standard service metrics + log fields

- Depends on: S0-LIB-02, S0-LIB-05
- Deliverable: enforce in every service:
  - HTTP server metrics (count, latency, status)
  - Outbound HTTP client metrics
  - Postgres pool gauges (active, idle, waiting)
  - Redis ops + hit/miss counters
  - Kafka producer/consumer counters + per-partition lag
  - Domain-specific counters (e.g. `votes_recorded_total`, `notifications_sent_total`, `feed_projector_delay_ms`)
- Definition of done: each metric appears in Prometheus with `service.name` label
- Owner: _unassigned_
- Status: ⏳

### Security hardening

#### S4-SEC-01 — Security hardening pass

- Depends on: every Sprint 1–3 service
- Deliverable: checklist completed and committed under `docs/security/checklist.md`:
  - TLS-ready config (gateway accepts TLS termination; internal mTLS noted as post-class scope)
  - Body-size limits on every endpoint
  - Input validation on every DTO using class-validator (or Zod)
  - Per-service authorization checks for every state-changing endpoint
  - Secrets sourced from env (dev) / Docker secrets / external secret manager (prod note)
  - MinIO buckets audited (S4-MINIO-01 policies confirmed)
  - Keycloak: token TTL, refresh-token rotation enabled, brute-force detection on
  - CORS allow-list (no `*`)
  - Security headers at gateway: HSTS, X-Content-Type-Options, X-Frame-Options
- Definition of done: checklist green; one negative test per item in CI
- Owner: _unassigned_
- Status: ⏳

#### S4-SEC-02 — Dependency + image scanning in CI

- Depends on: S0-CI-01
- Deliverable: CI step running `npm audit --audit-level=high` (fails on high/critical) + Trivy scan on every image build. Findings tracked in [risks-and-tradeoffs.md](risks-and-tradeoffs.md).
- Definition of done: CI fails on a deliberately-introduced vulnerable dependency
- Owner: _unassigned_
- Status: ⏳

### Performance + demo

#### S4-PERF-01 — Seed dataset + load script

- Depends on: every Sprint 1–3 service
- Deliverable:
  - `tools/seed/` script that creates ~50 users, ~30 tags, ~500 questions, ~1500 answers, ~5000 votes, ~3000 comments using realistic distributions
  - `tools/load/` k6 (or Artillery) script: read-heavy workload (search 60%, feed 30%, write 10%)
- Definition of done: seed completes in < 60s; load script reports baseline numbers (RPS, p95 latency by endpoint) committed to `docs/perf/baseline.md`
- Owner: _unassigned_
- Status: ⏳

#### S4-DEMO-01 — Demo scenario script

- Depends on: S4-PERF-01, S4-OBS-03
- Deliverable: `docs/demo/scenario.md` walking through HLD §21 deliverables:
  1. Service boundary diagram (link from HLD §7)
  2. DB ownership matrix (link from HLD §17 / [PLAN.md §2](../PLAN.md))
  3. Kafka event catalog (link from HLD §8)
  4. OpenSearch document shape (link from HLD §11)
  5. MongoDB feed document shape (link from HLD §10)
  6. Compose deployment view (link to working `docker-compose.yml`)
  7. Three end-to-end sequences: ask, answer + notify, accept + projection updates
  8. Tradeoff discussion (link to [risks-and-tradeoffs.md](risks-and-tradeoffs.md))
  - Includes commands to run each step + expected dashboard panels to point at
- Definition of done: a teammate who has not seen the project can run the demo from the script
- Owner: _unassigned_
- Status: ⏳

#### S4-DEMO-02 — Recorded walkthrough

- Depends on: S4-DEMO-01
- Deliverable: ~5 minute screen recording covering the demo scenario; stored under `docs/demo/walkthrough.mp4` (or external link)
- Definition of done: recording exists and is referenced from PLAN.md
- Owner: _unassigned_
- Status: ⏳

#### S4-COMPOSE-01 — Final compose pass

- Depends on: S4-MEDIA-02, S4-MOD-02, S4-OBS-03
- Deliverable: every service in HLD §16 present, healthy, joined to the right networks; `docker compose up -d` from a clean clone reaches healthy in < 3 minutes on a developer laptop
- Definition of done: cold-start time captured in `docs/perf/baseline.md`
- Owner: _unassigned_
- Status: ⏳

#### S4-E2E-01 — Final regression suite

- Depends on: S4-COMPOSE-01
- Deliverable: `tests/e2e/` covers Sprints 1–4 in one suite: identity, ask/answer/accept, votes, comments, notifications (REST + websocket), search, feed (home + tag), media upload + fetch, moderator close + downstream visibility removal
- Definition of done: suite green in CI; total runtime < 5 minutes
- Owner: _unassigned_
- Status: ⏳

---

## Risks (Sprint 4 specific)

- **MinIO bucket policy mistakes** are the most common Phase-2 security regression. Negative tests in CI are non-optional.
- **Observability stack adds resource pressure.** If laptops choke, document a `docker compose --profile light` that omits Grafana + Prometheus + Jaeger for everyday dev work.
- **Demo flakiness from cold caches / cold OpenSearch.** Scenario script should include a 30-second warm-up step before anyone watches.
- **Performance baseline is dev-grade.** Numbers from a developer laptop aren't predictive of production. Document this clearly so examiners don't over-read them.
