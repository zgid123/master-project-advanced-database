# Job Service

Fastify service for jobs, job applications, and domain event publishing. The
service now follows the MongoDB migration plan in
`compass_artifact_wf-7e0c03a3-2bd9-49a1-87cb-e27df5eb931b_text_markdown.md`:
`jobs` and `job_applications` are separate collections, identifiers are native
`ObjectId`, hot list queries use ESR-friendly partial indexes, and events are
written to `job_outbox` before a Redis Streams publisher sends them.

## Responsibilities

- List, search, create, update, and soft-delete jobs.
- Submit and list job applications.
- Check whether the current user already applied to a job.
- Update application status.
- Validate JWTs for protected job/application mutations.
- Store job/application events in MongoDB `job_outbox`.
- Publish pending outbox documents to Redis Stream `jobs.events`.

## Runtime And Storage

- Framework: Fastify
- Default port: `3010`
- API docs: `/docs`
- Primary store: MongoDB 7 replica set through the native driver
- Collections: `jobs`, `job_applications`, `job_outbox`, `idempotency_keys`
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
| `GET` | `/v1/jobs/:id/me/application` | Get current user's application status for a job |
| `GET` | `/v1/me/applications` | List current user's applications |
| `PATCH` | `/v1/applications/:id/status` | Update application status |

ObjectId values are returned as hex strings. Request/response bodies use
camelCase fields such as `postedByUserId`, `title`, `jobType`,
`applicationCount`, `coverLetter`, and `expectedStatus`.

## Local Commands

```sh
docker compose up -d mongodb redis
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
| `MONGODB_URI` | `mongodb://localhost:27017/jobs?replicaSet=rs0&directConnection=true` | MongoDB connection string |
| `MONGODB_DB_NAME` | `jobs` | MongoDB database name |
| `MONGODB_MAX_POOL_SIZE` | `50` | MongoDB max pool size |
| `MONGODB_MIN_POOL_SIZE` | `5` | MongoDB min pool size |
| `MONGODB_MAX_IDLE_TIME_MS` | `60000` | MongoDB idle connection timeout |
| `MONGODB_MAX_CONNECTING` | `4` | MongoDB concurrent connection establishment limit |
| `MONGODB_WAIT_QUEUE_TIMEOUT_MS` | `5000` | MongoDB wait queue timeout |
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

- JWT `sub` is expected to be a MongoDB ObjectId hex string for logical user
  references.
- `job_applications` stores denormalized job title/poster snapshots so user
  application lists do not require `$lookup`.
- The outbox publisher writes domain event topics such as `job.created`,
  `job.status_changed`, and `job.application.submitted` to `jobs.events`.
