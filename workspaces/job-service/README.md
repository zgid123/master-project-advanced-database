# Job Service

Fastify service for jobs, applications, and job/application event publishing.
It is optimized around PostgreSQL query shape, keyset pagination, cache-aside
reads, and an outbox publisher.

## Responsibilities

- List, search, create, update, and delete jobs.
- Create and list job applications.
- Update application status.
- Validate JWTs for protected job/application mutations.
- Store job/application events in PostgreSQL `event_outbox`.
- Publish unsent outbox rows to Redis Stream `jobs.events`.

## Runtime And Storage

- Framework: Fastify
- Default port: `3010`
- API docs: `/docs`
- Primary store: PostgreSQL through PgBouncer for runtime traffic
- Migration connection: direct PostgreSQL
- Cache/event transport: Redis
- JWT verification: HS256 local secret or RS256 public key/JWKS

## API Surface

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/` | Redirects to docs |
| `GET` | `/health` | Service health check |
| `GET` | `/v1/jobs` | List or search jobs |
| `POST` | `/v1/jobs` | Create job |
| `GET` | `/v1/jobs/:id` | Get job detail |
| `PATCH` | `/v1/jobs/:id` | Update job |
| `DELETE` | `/v1/jobs/:id` | Delete job |
| `POST` | `/v1/jobs/:id/applications` | Apply to job |
| `GET` | `/v1/jobs/:id/applications` | List applications for a job |
| `GET` | `/v1/me/applications` | List current user's applications |
| `PATCH` | `/v1/applications/:id/status` | Update application status |

The complete generated API inventory is in `../../API_REPORT.md`.

## Local Commands

```sh
docker compose up -d
pnpm --filter job-service migrate
pnpm --filter job-service dev
```

Validation:

```sh
pnpm --filter job-service typecheck
pnpm --filter job-service test
pnpm --filter job-service build
```

Outbox publisher:

```sh
pnpm --filter job-service publish-outbox
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3010` | Listen port |
| `HOST` | `0.0.0.0` | Listen host |
| `DATABASE_URL` | `postgres://jobsvc:jobsvc@localhost:6432/jobs` | Runtime PgBouncer URL |
| `DIRECT_DB_URL` | `postgres://jobsvc:jobsvc@localhost:5432/jobs` | Migration/direct PostgreSQL URL |
| `REDIS_URL` | `redis://localhost:6379` | Redis cache and stream URL |
| `JWT_SECRET` | `dev-secret` | Local HS256 verification |
| `JWT_PUBLIC_KEY` | unset | RS256 public key verification |
| `JWT_JWKS_URL` | unset | RS256 JWKS verification |

## Benchmark Commands

```sh
pnpm --filter job-service seed -- --jobs 100000 --apps 500000
pnpm --filter job-service bench:list-jobs
pnpm --filter job-service bench:apply-burst
```

`k6` must be installed separately. Record benchmark output in
`docs/results-template.md`.

## Architecture Notes

- The service expects JWT `sub` to be a numeric user id. Auth currently signs
  `sub` as email, so the cross-service token contract needs alignment.
- The outbox publisher writes to `jobs.events`; RecSys consumes `events:*`
  streams, so there is no direct bridge between these event models yet.
- Runtime traffic uses PgBouncer, while migrations use the direct PostgreSQL
  URL. Keep both URLs configured in non-local environments.
