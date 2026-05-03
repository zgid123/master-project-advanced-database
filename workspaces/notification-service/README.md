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
pnpm --filter notification-service consume-domain-events
```

Storage maintenance:

```sh
pnpm --filter notification-service maintain:storage
```

Run the maintenance command daily in cron to create future partitions and remove old dedup/device-token rows.
