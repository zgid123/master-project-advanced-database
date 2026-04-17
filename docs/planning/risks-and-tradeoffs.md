# Risks and Tradeoffs

Architectural risks (carried forward from HLD §19) and implementation-specific risks discovered while planning. Each risk has a **mitigation** and, where relevant, the **task IDs** that own it.

---

## Architectural Tradeoffs (from HLD §19)

### A1. We chose system-design realism over implementation simplicity

- **Why this is a real cost:** more services, more infra, more failure modes, harder local testing.
- **Mitigation:** sprint plan stages services by dependency, not by ambition. Sprint 0 + 1 alone gives a working monolith-equivalent demo before async complexity lands in Sprint 2.
- **Talking point for defense:** the HLD's §20 sentences are pre-approved language — use them.

### A2. Eventual consistency is part of the contract, not a bug

- **Affected paths:** search, feed, notifications.
- **Window in dev:** target < 3s end-to-end (event → projection visible).
- **Mitigation:** documented in [03-sprint3-search-and-feed.md](03-sprint3-search-and-feed.md) E2E asserting bounded staleness; demo script shows the lag intentionally.

### A3. No global ACID across services

- **Mitigation:** local ACID inside each service; sagas/choreography across services. Compensating actions documented per workflow in HLD §12.

---

## Implementation Risks

### I1. Dual-write hazard (Postgres write + Kafka publish)

- **Risk:** crash between DB commit and Kafka ack drops events; downstream projections silently diverge.
- **Mitigation:** **transactional outbox is non-negotiable** for every event-producing service. Owned by [S2-OUTBOX-01](02-sprint2-interactions-and-events.md#s2-outbox-01--transactional-outbox-pattern-shared).
- **Detection:** outbox table has a `published_at IS NULL` query as a metric ([S4-OBS-04](04-sprint4-moderation-media-and-hardening.md#s4-obs-04--standard-service-metrics--log-fields)); alert if rows accumulate.

### I2. Event-schema drift

- **Risk:** producer adds a required field; consumers crash.
- **Mitigation:**
  - Shared `@devqa/contracts/events` package — producer and consumer compile against the same TypeScript types.
  - Versioning rule in [cross-cutting.md §8](cross-cutting.md#8-event-envelope-devqacontractsevents): never break `v1`; introduce `v2` topic + dual-publish.
  - Snapshot tests on event types in CI.

### I3. Out-of-order events at consumers

- **Risk:** `vote.changed` arrives before `question.created` for a brand-new question.
- **Mitigation:**
  - Partition key = `aggregateId` for in-aggregate ordering.
  - Consumers must tolerate "target not present yet" → DLQ + retry with backoff.
  - Document expected behavior in each consumer's README.

### I4. Saga partial failure (cross-service workflows)

- **Risk:** moderator deletes a question; Indexer succeeds, Feed Projector fails — user sees inconsistent state.
- **Mitigation:**
  - Each consumer is independently retryable from Kafka offset.
  - Idempotent handlers (Redis dedupe).
  - Manual replay tooling: `pnpm --filter <consumer> replay --from-offset N`.
  - Document recovery runbook in `docs/ops/runbook.md` (out of class scope to write the runbook fully; stub it).

### I5. Local-dev resource footprint

- **Risk:** Postgres + Kafka + Zookeeper + OpenSearch + Mongo + Keycloak + MinIO + otel-collector + Prometheus + Grafana + Jaeger + 14 NestJS services on a laptop is heavy.
- **Mitigation:**
  - Document ≥ 8 GB RAM allocation to Docker in README.
  - `docker compose --profile light` excludes observability stack for everyday work ([S4-OBS-03](04-sprint4-moderation-media-and-hardening.md#s4-obs-03--grafana-dashboards-provisioned) note).
  - OpenSearch heap capped at 512m ([S3-OS-01](03-sprint3-search-and-feed.md#s3-os-01--opensearch--dashboards-operational)).

### I6. Single-node websocket fanout

- **Risk:** scaling Notification Service to multiple replicas breaks realtime delivery — only the replica holding the user's socket can reach them.
- **Mitigation:**
  - Acceptable for class scope (single replica).
  - Documented evolution: Redis pub/sub channel `notification:fanout` so any replica can broadcast to any held socket. Owner: post-class.

### I7. Vote-spam notifications

- **Risk:** every vote = one event; naive notify floods users.
- **Mitigation:** [S2-NOTIF-02](02-sprint2-interactions-and-events.md#s2-notif-02--notification-service-consumers--recipient-resolution) only emits notifications on milestone thresholds (e.g. crossing +5 / +10).

### I8. Cache invalidation correctness (feed first-page cache)

- **Risk:** invalidation pub/sub message lost → users see stale top items for up to 30s.
- **Mitigation:** TTL bound (30s) caps damage; documented as acceptable in [S3-FEED-01](03-sprint3-search-and-feed.md#s3-feed-01--feed-service-read-api).

### I9. MinIO bucket policy regressions

- **Risk:** the most common Phase-2 security mistake — accidentally exposing private uploads.
- **Mitigation:** explicit negative tests in CI ([S4-SEC-01](04-sprint4-moderation-media-and-hardening.md#s4-sec-01--security-hardening-pass)). Anonymous access to private bucket must return 403 on every CI run.

### I10. Migration tool lock-in

- **Risk:** [S0-REPO-03](00-foundation.md#s0-repo-03--decide-and-document-migration-tool) picks once for the whole repo; switching mid-project is expensive.
- **Mitigation:** ADR makes the choice explicit and reviewable. Recommendation: Prisma (best NestJS DX), with TypeORM as fallback.

### I11. OpenSearch reindex coordination

- **Risk:** alias swap during active producers causes brief inconsistency.
- **Mitigation:** [S3-INDEXER-02](03-sprint3-search-and-feed.md#s3-indexer-02--reindex-cli) requires the swap to be atomic; tested with active load.

### I12. Performance baseline overinterpretation

- **Risk:** dev-laptop numbers from [S4-PERF-01](04-sprint4-moderation-media-and-hardening.md#s4-perf-01--seed-dataset--load-script) get cited as production figures.
- **Mitigation:** explicit caveat in `docs/perf/baseline.md` — "single-node Docker Compose on a developer laptop; not predictive of production."

### I13. Profile bootstrap path on first login

- **Risk:** Keycloak knows about the user before User Service does; first authenticated request fails because no local row exists.
- **Mitigation:** decide one of (a) Keycloak event listener POSTs to User Service on user creation, (b) lazy provisioning in BFF on first authenticated request. Decide and document in [S1-USER-02](01-sprint1-identity-and-core.md#s1-user-02--user-service-api-crud--public-profile).

---

## Risk Register Summary

| ID  | Severity                | Status                                 | Owner        |
| --- | ----------------------- | -------------------------------------- | ------------ |
| A1  | n/a (accepted tradeoff) | acknowledged                           | architecture |
| A2  | n/a (accepted tradeoff) | acknowledged                           | architecture |
| A3  | n/a (accepted tradeoff) | acknowledged                           | architecture |
| I1  | High                    | mitigated by S2-OUTBOX-01              | _unassigned_ |
| I2  | Medium                  | mitigated by contracts package         | _unassigned_ |
| I3  | Medium                  | mitigated by partition key + DLQ       | _unassigned_ |
| I4  | Medium                  | runbook stub only                      | _unassigned_ |
| I5  | Medium                  | mitigated by docs + light profile      | _unassigned_ |
| I6  | Low                     | accepted; evolution path documented    | _unassigned_ |
| I7  | Medium                  | mitigated by milestone filter          | _unassigned_ |
| I8  | Low                     | accepted; TTL-bounded                  | _unassigned_ |
| I9  | High                    | mitigated by S4-SEC-01 negative tests  | _unassigned_ |
| I10 | Medium                  | mitigated by S0-REPO-03 ADR            | _unassigned_ |
| I11 | Medium                  | mitigated by S3-INDEXER-02 atomic swap | _unassigned_ |
| I12 | Low                     | mitigated by docs caveat               | _unassigned_ |
| I13 | Medium                  | decision pending in S1-USER-02         | _unassigned_ |
