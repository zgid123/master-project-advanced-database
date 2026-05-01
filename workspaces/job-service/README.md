# Job Service

Performance-first Job and Job Application service based on the compass roadmap.

## Local Run

```sh
docker compose up -d
pnpm --filter job-service migrate
pnpm --filter job-service dev
```

The API listens on `http://localhost:3010`.

## Verification

```sh
docker compose exec postgres psql -U jobsvc -d jobs -c "SELECT version();"
docker compose exec redis redis-cli PING
pnpm --filter job-service build
```

Migration commands use `DIRECT_DB_URL` and connect directly to PostgreSQL on port `5432`. Runtime traffic uses `DATABASE_URL` through PgBouncer on port `6432`.

## Auth

Local development uses `JWT_SECRET` with HS256. For integration with the Auth service, set either `JWT_PUBLIC_KEY` or `JWT_JWKS_URL`; the service will verify RS256 tokens and cache JWKS keys for `JWT_JWKS_CACHE_TTL_MS`.

## Benchmark Flow

```sh
pnpm --filter job-service seed -- --jobs 100000 --apps 500000
pnpm --filter job-service bench:list-jobs
pnpm --filter job-service bench:apply-burst
```

`k6` must be installed separately on the machine running benchmark scripts.
