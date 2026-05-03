# Notification Service Benchmark Notes

## S1 Inbox Read

- Command: `BASE_URL=http://127.0.0.1:3020 JWT=<token> pnpm --filter notification-service bench:inbox`
- KPI: p99 < 50ms, cache hit > 95%.
- Record: p50, p95, p99, RPS, error rate, Postgres CPU, Redis ops/sec.

## S2 Fan-out Spike

- Command: `RECIPIENTS=1000 pnpm --filter notification-service bench:fanout`
- KPI: event to all inbox rows < 10s for 10K recipients.
- Record: insert throughput, BullMQ waiting/active/failed, Redis memory, Postgres WAL rate.

## S3 Mark-as-read Burst

- Use `PATCH /v1/notifications/:public_id/read` with authenticated users.
- KPI: p99 < 30ms, HOT update ratio > 85%.

## S4 Realtime

- Run `pnpm --filter notification-service realtime`, connect Socket.IO clients to `:3021`.
- KPI: p99 receive lag < 1s.

## S5 Digest

- Command: `pnpm --filter notification-service digest:daily`.
- KPI: 1M users < 2h after batch tuning.
