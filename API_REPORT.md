# API Report

Generated: 2026-05-13T15:23:40.289Z

## Tool Run

- `pnpm docs:api` regenerated this report from static TypeScript source analysis.
- The extractor is committed at `scripts/generate-api-docs.mjs` and does not require temp-only tooling.
- `API_INVENTORY.md` contains the full route and exported API list.

## Report Scope

- Included: TypeScript source under `workspaces/` and `packages/`.
- Excluded: tests, generated route trees, declaration files, build output, and node_modules.
- Static analysis limitation: this report describes declared API surfaces; it does not prove runtime reachability, middleware behavior, or runtime-generated schemas.

## API Surface Summary

| Component | Files scanned | REST/server routes | Exported function/class APIs | Main role |
| --- | ---: | ---: | ---: | --- |
| API Gateway | 20 | 35 | 37 | Public proxy for Auth, Notifications, public substacks, and Q&A topic/comment routes. |
| Auth Service | 77 | 18 | 136 | Identity, JWT/refresh lifecycle, user follows, substacks, repositories, seeds, and notification integration. |
| Dashboard | 93 | 33 | 100 | TanStack Start UI plus server proxy routes for auth, substacks, topics, notifications, jobs, and recommendations. |
| Job Service | 25 | 12 | 44 | Fastify app, job/application routes, MongoDB access, JWT validation, Redis outbox publisher. |
| Notifications Service | 27 | 5 | 39 | Portal/internal notification routes, notification commands/queries, Mongo repository, system notification mapping. |
| Q&A Service | 44 | 17 | 130 | Nest controllers/services/DTOs/schemas for topics, comments, voting, subscriptions, MongoDB, and Elasticsearch search. |
| Recommendation Service | 29 | 19 | 81 | Fastify recommendation routes, Redis stream ingestion, Neo4j graph logic, ranking/scoring, BullMQ jobs, metrics. |
| Shared Domain - Auth | 30 | 0 | 66 | Auth/substack/user schemas, entities, repository contracts, and domain errors. |
| Shared Domain - Notification | 7 | 0 | 6 | Notification schema, entity, and repository contract. |
| Shared Node - Hono | 8 | 0 | 5 | Reusable Hono middleware for IoC, Drizzle, Mongoose, internal auth, and logging. |
| Shared Node - Utils | 2 | 0 | 2 | Shared utilities. |

## REST Route Groups

### API Gateway

- `GET /health`
- `GET /v1/auth/profile`
- `POST /v1/auth/refresh`
- `POST /v1/auth/sign-in`
- `POST /v1/auth/sign-out`
- `POST /v1/auth/sign-up`
- `DELETE /v1/auth/users/:userId/subscribe`
- `POST /v1/auth/users/:userId/subscribe`
- `POST /v1/comments`
- `DELETE /v1/comments/:id`
- `PATCH /v1/comments/:id`
- `PATCH /v1/comments/:id/accept`
- `POST /v1/comments/:id/vote`
- `GET /v1/notifications`
- `PATCH /v1/notifications/:id/read`
- `GET /v1/substacks`
- `POST /v1/substacks`
- `DELETE /v1/substacks/:slug`
- `GET /v1/substacks/:slug`
- `PUT /v1/substacks/:slug`
- `DELETE /v1/substacks/:slug/subscribe`
- `POST /v1/substacks/:slug/subscribe`
- `GET /v1/substacks/owned`
- `GET /v1/substacks/total`
- `POST /v1/topics`
- `DELETE /v1/topics/:id`
- `GET /v1/topics/:id`
- `PATCH /v1/topics/:id`
- `GET /v1/topics/:id/comments`
- `PATCH /v1/topics/:id/solve`
- `POST /v1/topics/:id/subscribe`
- `POST /v1/topics/:id/unsubscribe`
- `DELETE /v1/topics/:id/vote`
- `POST /v1/topics/:id/vote`
- `GET /v1/topics/search`

### Auth Service

- `POST /admin/substacks/:slug/approve`
- `GET /health`
- `GET /v1/auth/profile`
- `POST /v1/auth/refresh`
- `POST /v1/auth/sign-in`
- `POST /v1/auth/sign-out`
- `POST /v1/auth/sign-up`
- `DELETE /v1/auth/users/:userId/subscribe`
- `POST /v1/auth/users/:userId/subscribe`
- `GET /v1/substacks`
- `POST /v1/substacks`
- `DELETE /v1/substacks/:slug`
- `GET /v1/substacks/:slug`
- `PUT /v1/substacks/:slug`
- `DELETE /v1/substacks/:slug/subscribe`
- `POST /v1/substacks/:slug/subscribe`
- `GET /v1/substacks/owned`
- `GET /v1/substacks/total`

### Dashboard

- `POST /api/auth/$`
- `GET /api/portal/auth/profile`
- `POST /api/portal/comments`
- `DELETE /api/portal/comments/$`
- `PATCH /api/portal/comments/$`
- `POST /api/portal/comments/$`
- `GET /api/portal/notifications`
- `PATCH /api/portal/notifications/$`
- `GET /api/portal/substacks`
- `POST /api/portal/substacks`
- `DELETE /api/portal/substacks/$slug`
- `GET /api/portal/substacks/$slug`
- `PUT /api/portal/substacks/$slug`
- `DELETE /api/portal/substacks/$slug/subscribe`
- `POST /api/portal/substacks/$slug/subscribe`
- `GET /api/portal/substacks/owned`
- `GET /api/portal/substacks/total`
- `GET /api/portal/topics`
- `POST /api/portal/topics`
- `DELETE /api/portal/topics/$`
- `GET /api/portal/topics/$`
- `PATCH /api/portal/topics/$`
- `POST /api/portal/topics/$`
- `PATCH /api/services/applications/$`
- `GET /api/services/jobs`
- `POST /api/services/jobs`
- `DELETE /api/services/jobs/$`
- `GET /api/services/jobs/$`
- `PATCH /api/services/jobs/$`
- `POST /api/services/jobs/$`
- `GET /api/services/me/applications`
- `GET /api/services/recommendations`
- `GET /api/services/recommendations/$`

### Job Service

- `GET /`
- `GET /health`
- `PATCH /v1/applications/:id/status`
- `GET /v1/jobs`
- `POST /v1/jobs`
- `DELETE /v1/jobs/:id`
- `GET /v1/jobs/:id`
- `PATCH /v1/jobs/:id`
- `GET /v1/jobs/:id/applications`
- `POST /v1/jobs/:id/applications`
- `GET /v1/jobs/:id/me/application`
- `GET /v1/me/applications`

### Notifications Service

- `GET /health`
- `POST /internal/v1/notifications`
- `POST /internal/v1/notifications/batch`
- `GET /v1/notifications`
- `PATCH /v1/notifications/:id/read`

### Q&A Service

- `GET /`
- `POST /comments`
- `DELETE /comments/:id`
- `PATCH /comments/:id`
- `PATCH /comments/:id/accept`
- `POST /comments/:id/vote`
- `POST /topics`
- `DELETE /topics/:id`
- `GET /topics/:id`
- `PATCH /topics/:id`
- `GET /topics/:id/comments`
- `PATCH /topics/:id/solve`
- `POST /topics/:id/subscribe`
- `POST /topics/:id/unsubscribe`
- `DELETE /topics/:id/vote`
- `POST /topics/:id/vote`
- `GET /topics/search`

### Recommendation Service

- `GET /`
- `GET /health`
- `GET /internal/health`
- `GET /internal/metrics`
- `GET /internal/ready`
- `POST /internal/reindex/user/:userId`
- `GET /metrics`
- `GET /v1/feed`
- `GET /v1/health`
- `POST /v1/internal/events/comment`
- `POST /v1/internal/events/subscription`
- `POST /v1/internal/events/substack`
- `POST /v1/internal/events/topic`
- `POST /v1/internal/events/vote`
- `GET /v1/similar/topics/:id`
- `GET /v1/similar/users/:id`
- `GET /v1/topics/:id/similar`
- `GET /v1/trending`
- `GET /v1/users/:id/suggested-substacks`

## Function/Class API Families

### API Gateway

Public proxy for Auth, Notifications, public substacks, and Q&A topic/comment routes.

Representative callable/class APIs from the generated inventory:
- `AUTH_TOKEN_COOKIE_NAME`
- `authEndpoints`
- `authMiddleware`
- `AuthService`
- `AuthService.createSubstack`
- `AuthService.deleteSubstack`
- `AuthService.getSubstackBySlug`
- `AuthService.getTotalSubstacks`
- `AuthService.listOwnedSubstacks`
- `AuthService.listSubstacks`
- `AuthService.profile`
- `AuthService.refresh`
- Additional generated callable APIs: 25. See `API_INVENTORY.md` for the full list.

### Auth Service

Identity, JWT/refresh lifecycle, user follows, substacks, repositories, seeds, and notification integration.

Representative callable/class APIs from the generated inventory:
- `adminSubstackEndpoints`
- `AllowedTokenRepository`
- `AllowedTokenRepository.create`
- `AllowedTokenRepository.delete`
- `AllowedTokenRepository.findOne`
- `ApproveSubstackCommand`
- `ApproveSubstackCommand.exec`
- `AUTH_TOKEN_COOKIE_NAME`
- `authEndpoints`
- `authenticatedUserMiddleware`
- `AuthError`
- `AuthError.invalidCredentials`
- Additional generated callable APIs: 124. See `API_INVENTORY.md` for the full list.

### Dashboard

TanStack Start UI plus server proxy routes for auth, substacks, topics, notifications, jobs, and recommendations.

Representative callable/class APIs from the generated inventory:
- `AUTH_MUTATION_KEYS`
- `authEvents`
- `AuthForm`
- `AuthModal`
- `BetterAuthHeader`
- `cn`
- `CommunityTopic`
- `createSubstack`
- `createUpstreamPath`
- `deleteSubstack`
- `FeedTopic`
- `Footer`
- Additional generated callable APIs: 88. See `API_INVENTORY.md` for the full list.

### Job Service

Fastify app, job/application routes, MongoDB access, JWT validation, Redis outbox publisher.

Representative callable/class APIs from the generated inventory:
- `ApplicationRepo`
- `applicationRoutes`
- `ApplicationService`
- `applicationStatuses`
- `buildApp`
- `closeMongo`
- `config`
- `createJobSchema`
- `decodeCursor`
- `delKeys`
- `down`
- `encodeCursor`
- Additional generated callable APIs: 32. See `API_INVENTORY.md` for the full list.

### Notifications Service

Portal/internal notification routes, notification commands/queries, Mongo repository, system notification mapping.

Representative callable/class APIs from the generated inventory:
- `AUTH_SIGN_UP_WELCOME_NOTIFICATION_BODY`
- `AUTH_SIGN_UP_WELCOME_NOTIFICATION_TITLE`
- `baseEndpoints`
- `createAnswerVoteNotificationBody`
- `createMongoose`
- `CreateNotificationCommand`
- `CreateNotificationCommand.exec`
- `createSocialUserSubscribedNotificationBody`
- `createSubstackApprovedNotificationBody`
- `createSubstackCreatedNotificationBody`
- `createSubstackSubscribedNotificationBody`
- `createSubstackTopicCreatedNotificationBody`
- Additional generated callable APIs: 27. See `API_INVENTORY.md` for the full list.

### Q&A Service

Nest controllers/services/DTOs/schemas for topics, comments, voting, subscriptions, MongoDB, and Elasticsearch search.

Representative callable/class APIs from the generated inventory:
- `AppController`
- `AppController.getHello`
- `AppModule`
- `AppService`
- `AppService.getHello`
- `Comment`
- `CommentAcceptedResponseSwagger`
- `CommentCreatedResponseSwagger`
- `CommentDeletedResponseSwagger`
- `CommentResponseDto`
- `CommentSchema`
- `CommentsController`
- Additional generated callable APIs: 118. See `API_INVENTORY.md` for the full list.

### Recommendation Service

Fastify recommendation routes, Redis stream ingestion, Neo4j graph logic, ranking/scoring, BullMQ jobs, metrics.

Representative callable/class APIs from the generated inventory:
- `acquireFeedLock`
- `appendEventsToStream`
- `buildApp`
- `candidatesPerFeed`
- `closeBatchQueue`
- `closeNeo4jDriver`
- `closeRedis`
- `commentEventSchema`
- `config`
- `createBatchWorker`
- `decodeCursor`
- `dedupeCandidates`
- Additional generated callable APIs: 69. See `API_INVENTORY.md` for the full list.

### Shared Domain - Auth

Auth/substack/user schemas, entities, repository contracts, and domain errors.

Representative callable/class APIs from the generated inventory:
- `AllowedToken`
- `AllowedTokenEntity`
- `AllowedTokenEntity.create`
- `CANNOT_CREATE_SUBSTACK_CODE`
- `CANNOT_CREATE_SUBSTACK_NAME`
- `CANNOT_CREATE_TOKEN_CODE`
- `CANNOT_CREATE_TOKEN_NAME`
- `CANNOT_CREATE_USER_CODE`
- `CANNOT_CREATE_USER_NAME`
- `CANNOT_UPDATE_SUBSTACK_CODE`
- `CANNOT_UPDATE_SUBSTACK_NAME`
- `CreateAllowedToken`
- Additional generated callable APIs: 54. See `API_INVENTORY.md` for the full list.

### Shared Domain - Notification

Notification schema, entity, and repository contract.

Representative callable/class APIs from the generated inventory:
- `CreateNotification`
- `CreateSystemNotification`
- `CreateSystemNotificationsBatch`
- `Notification`
- `NotificationEntity`
- `NotificationEntity.create`

### Shared Node - Hono

Reusable Hono middleware for IoC, Drizzle, Mongoose, internal auth, and logging.

Representative callable/class APIs from the generated inventory:
- `createDrizzleMiddleware`
- `createLoggerMiddleware`
- `createMongooseMiddleware`
- `createRegisterIoCMiddleware`
- `internalAuthMiddleware`

### Shared Node - Utils

Shared utilities.

Representative callable/class APIs from the generated inventory:
- `parsePagy`
- `slugify`

## Architecture-Relevant Conclusions From API Surface

1. The current generated surface is 139 REST/server routes and 646 exported function/class APIs.
2. API Gateway fronts Auth, Notifications, public Substacks, and Q&A topic/comment routes.
3. Dashboard now provides server proxy routes for Auth, Substacks, Q&A topics/comments, Notifications, Job Service, and Recommendation Service.
4. Job Service and RecSys remain standalone upstream services; Dashboard proxies them directly rather than through API Gateway.
5. Q&A owns topic/comment/vote data and still depends on Elasticsearch for search unless a fallback is implemented.
6. Shared packages expose domain entities, schemas, repository contracts, and reusable Node/Hono helpers.

## Source Artifacts

- Full REST and exported callable list: `API_INVENTORY.md`.
- Architecture summary: `ARCHITECTURE.md`.
- Shared package exported APIs counted in summary: 79.
