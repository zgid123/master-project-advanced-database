# Notification Service

Production-prototype Notification microservice for Solvit.

Implemented from the provided plan:

- PostgreSQL inbox source of truth with monthly range partitions.
- Redis cache, feed sorted sets, BullMQ queues, Redis Streams, and Socket.IO fan-out.
- Fastify HTTP API with JWT guard, Swagger UI, metrics, migrations, seed scripts, workers, realtime gateway, digest, outbox publisher, and k6 load-test skeletons.

## Local

```sh
docker compose up -d
pnpm install
pnpm --filter notification-service migrate
pnpm --filter notification-service seed
pnpm --filter notification-service dev
```

Swagger UI: `http://127.0.0.1:3020/docs`

Realtime gateway:

```sh
pnpm --filter notification-service realtime
```

Workers:

```sh
pnpm --filter notification-service worker:create
pnpm --filter notification-service worker:delivery
pnpm --filter notification-service worker:scheduled
pnpm --filter notification-service consume-domain-events
```

Storage maintenance:

```sh
pnpm --filter notification-service maintain:storage
```

Run the maintenance command daily in cron, Kubernetes CronJob, or your scheduler of choice. It creates future `notifications` and `notification_deliveries` partitions and removes old dedup/device-token rows in chunks. Tune cleanup with `NOTIFICATION_CLEANUP_BATCH_SIZE`.

Deployment examples:

- Kubernetes CronJobs for storage maintenance and digest enqueueing: `deploy/k8s/cronjobs.yaml`
- Prometheus alert rules for failed queues and exhausted scheduled retries: `deploy/prometheus/alerts.yaml`
- GitHub Actions CI: `.github/workflows/notification-service.yml`

## Operational Notes

- `public_id` defaults to UUIDv7 for locality, but PostgreSQL cannot enforce global `UNIQUE (public_id)` on this range-partitioned table without including the partition key. Inbox reads and mutations intentionally scope by `(user_id, public_id)`.
- JWT verification supports HS256 for local development and RS256/JWKS for production. Set `JWT_ISSUER` and comma-separated `JWT_AUDIENCE` to enforce `iss` and `aud` claims on both REST and realtime connections.
- Internal ingestion uses `x-internal-token` and is rate-limited per `x-service-name` plus requester IP with `INTERNAL_RATE_LIMIT_PER_MINUTE` requests per minute. Set it to `0` to disable. By default, rate limiting fails open if Redis is unavailable; set `INTERNAL_RATE_LIMIT_FAIL_CLOSED=true` to return `503` instead.
- Scheduled notifications use statuses `0=pending`, `1=processing`, `2=fired`, `3=cancelled`, and `4=failed`. The worker records `processed_at`, `failed_at`, and `last_error`, uses retry backoff, and refreshes its processing lease while a row is in progress. `SCHEDULED_NOTIFICATION_LEASE_SECONDS` is clamped to at least 30 seconds; repeated heartbeat failures stop the worker from marking a stale lease as fired. `SCHEDULED_NOTIFICATION_HEARTBEAT_FAILURE_LIMIT=1` is fail-fast and should mainly be used for tests. Surface poison rows with `SELECT id, attempts, last_error FROM scheduled_notifications WHERE status = 4 ORDER BY failed_at DESC;`.
- Queue metrics include `bullmq_queue_waiting{queue=...}` and `bullmq_queue_failed{queue=...}`. Scheduled retry exhaustion is exposed as `scheduled_notification_failed_total{category=...}`.
- The service uses hand-written SQL through `pg` to keep partition-aware queries explicit; there is no ORM layer.
