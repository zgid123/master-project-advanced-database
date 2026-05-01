# Introduce

Master's degree Project - Advanced Database

# Install

```sh
pnpm install
```

```sh
pnpm -w build
```

# Structure

```sh
├── @types
└── workspaces
    ├── api-gateway
    ├── dashboard
    └── job-service
```

- api-gateway: API Gateway
- dashboard: FE App
- job-service: Fastify/PostgreSQL/Redis Job and Job Application service

# Job Service

```sh
docker compose up -d
pnpm --filter job-service migrate
pnpm --filter job-service dev
```
