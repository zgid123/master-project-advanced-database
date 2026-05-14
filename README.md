# Solvit Backend

TypeScript monorepo for the Solvit advanced database project. The repository is
organized as service workspaces plus shared domain/node packages.

## Workspaces

| Workspace | Runtime | Responsibility |
| --- | --- | --- |
| `workspaces/api-gateway` | Hono | Public proxy for Auth, Notifications, Substacks, and Q&A topics/comments |
| `workspaces/auth` | Hono | Identity, JWT/refresh tokens, users, follows, substacks |
| `workspaces/notifications` | Hono | User notification storage and internal notification creation |
| `workspaces/qna` | NestJS | Topics, comments, votes, subscriptions, search |
| `workspaces/job-service` | Fastify | Jobs, applications, MongoDB outbox, Redis publishing |
| `workspaces/recsys` | Fastify | Recommendation APIs, Neo4j graph, Redis stream ingestion |
| `workspaces/dashboard` | TanStack Start | Frontend shell plus auth, substack, Q&A, notification, job, and recommendation proxies |

Shared packages live under `packages/`:

- `@domain/auth`
- `@domain/core`
- `@domain/notification`
- `@node/drizzle`
- `@node/hono`
- `@node/utils`

## Documentation

- `ARCHITECTURE.md`: system architecture and review notes.
- `API_REPORT.md`: generated API surface summary.
- `API_INVENTORY.md`: full generated route/function inventory.
- `workspaces/*/README.md`: component-specific technical notes.

Regenerate the API docs after route or exported API changes:

```sh
pnpm docs:api
```

## Local Setup

This repo uses `pnpm@10.33.4` through Corepack.

macOS/Linux:

```sh
corepack enable
pnpm install
pnpm sync:workspace
docker compose up -d
```

Windows on exFAT:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-windows.ps1
docker compose up -d
```

The Windows setup script creates the pnpm Corepack shim in the user npm folder,
runs an exFAT-safe install, and syncs local workspace packages into
`node_modules`. If `pnpm` is already available, `pnpm setup:windows` runs the
same script.

`pnpm sync:workspace` is cross-platform. It links workspace packages when the
filesystem supports links, and copies them when links are not supported. Root
commands such as `pnpm build`, `pnpm dev`, `pnpm test`, and `pnpm server:dev`
run this sync automatically. Run `pnpm sync:workspace` manually after editing a
shared package if you are starting a service directly with `pnpm --filter ...`.

Useful service commands:

```sh
pnpm --filter auth db:migrate
pnpm --filter job-service migrate
pnpm --filter recsys migrate
pnpm --filter api-gateway dev
pnpm --filter auth dev
pnpm --filter notifications dev
pnpm --filter qna start:dev
pnpm --filter qna seed:topics
pnpm --filter dashboard dev
```

Build all workspaces:

```sh
pnpm -w build
```

## Current Local Ports

| Service | Port |
| --- | ---: |
| API Gateway | `3000` |
| Auth | `3001` |
| Notifications | `3002` |
| Q&A | `3005` |
| Job Service | `3010` |
| RecSys | `3020` |
| Dashboard | `4000` |
| PostgreSQL | `5432` |
| PgBouncer | `6432` |
| Redis | `6379` |
| MongoDB | `27017` |
| Mongo Express | `8081` |
| Elasticsearch | `9200` |
| Neo4j HTTP/Bolt | `7474` / `7687` |

Q&A defaults to `3005`. API Gateway proxies it through `QNA_SERVICE_URL`,
which also defaults to `http://localhost:3005`.
