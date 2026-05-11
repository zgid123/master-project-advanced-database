# API Report

Generated: 2026-05-11T15:15:16.541Z

## Tool Run

- TypeDoc was run successfully and generated `API_TYPEDOC.json` from exported TypeScript declarations.
- A temporary `ts-morph` extractor generated `API_INVENTORY.md` for REST/server routes and exported callable APIs.
- Tooling lives outside the repo dependency graph at `%TEMP%/codex-api-tools`; app `package.json` and lockfiles were not changed.

## Report Scope

- Included: TypeScript source under `workspaces/` and `packages/`.
- Excluded: tests, generated route trees, declaration files, build output, and node_modules.
- Static analysis limitation: this report describes declared API surfaces; it does not prove runtime reachability, middleware behavior, or request/response schemas generated at runtime.

## API Surface Summary

| Component | Files scanned | REST/server routes | Exported function/class APIs | Main role |
| --- | ---: | ---: | ---: | --- |
| API Gateway | 16 | 8 | 13 | Thin public proxy layer for Auth and Notifications, plus cookie/upstream response helpers. |
| Auth Service | 72 | 13 | 67 | Identity, JWT/refresh token lifecycle, user follows, substacks, repositories, seeds, and notification integration. |
| Dashboard | 30 | 6 | 23 | TanStack Start server routes and client auth APIs/hooks wrapping Gateway/Better Auth behavior. |
| Job Service | 24 | 11 | 17 | Fastify app, job/application routes, PostgreSQL access, JWT validation, Redis outbox publisher. |
| Notifications Service | 27 | 5 | 18 | Portal/internal notification routes, notification commands/queries, Mongo repository, system notification mapping. |
| Q&A Service | 43 | 17 | 98 | Nest controllers/services/DTOs/schemas for topics, comments, voting, subscriptions, MongoDB, and Elasticsearch search. |
| Recommendation Service | 29 | 19 | 63 | Fastify recommendation routes, Redis stream ingestion, Neo4j graph repository logic, ranking/scoring, BullMQ jobs, metrics. |
| Shared Domain - Auth | 30 | 0 | 10 | Auth/substack/user schemas, entities, repository contracts, and domain errors. |
| Shared Domain - Notification | 7 | 0 | 1 | Notification schema, entity, and repository contract. |
| Shared Node - Hono | 8 | 0 | 5 | Reusable Hono middleware for IoC, Drizzle, Mongoose, internal auth, and logging. |
| Shared Node - Utils | 1 | 0 | 1 | Shared pagination utility. |

## TypeDoc Declaration Summary

| Component | Classes | Interfaces | Functions | Methods | Type aliases | Variables | Enums |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| API Gateway | 2 | 2 | 5 | 7 | 1 | 7 | 0 |
| Auth Service | 27 | 5 | 17 | 50 | 17 | 26 | 0 |
| Dashboard | 0 | 0 | 13 | 0 | 1 | 4 | 0 |
| Job Service | 1 | 0 | 16 | 0 | 14 | 22 | 0 |
| Notifications Service | 5 | 3 | 11 | 7 | 2 | 16 | 0 |
| Q&A Service | 40 | 0 | 0 | 70 | 0 | 19 | 0 |
| Recommendation Service | 1 | 0 | 62 | 0 | 16 | 18 | 0 |
| Shared Domain - Auth | 8 | 18 | 0 | 32 | 28 | 42 | 0 |
| Shared Domain - Notification | 1 | 3 | 0 | 4 | 5 | 4 | 0 |
| Shared Node - Hono | 0 | 2 | 5 | 0 | 0 | 0 | 0 |
| Shared Node - Utils | 0 | 2 | 1 | 0 | 1 | 0 | 0 |
| Shared Domain - Core | 0 | 3 | 0 | 3 | 3 | 1 | 0 |
| Shared Node - Drizzle | 0 | 0 | 0 | 0 | 0 | 2 | 0 |
| Other | 0 | 0 | 0 | 5 | 0 | 0 | 0 |

## REST Route Groups

### API Gateway
- `GET /health` (Hono)
- `GET /v1/auth/profile` (Hono)
- `POST /v1/auth/refresh` (Hono)
- `POST /v1/auth/sign-in` (Hono)
- `POST /v1/auth/sign-up` (Hono)
- `DELETE /v1/auth/users/:userId/subscribe` (Hono)
- `POST /v1/auth/users/:userId/subscribe` (Hono)
- `GET /v1/notifications` (Hono)

### Auth Service
- `POST /admin/substacks/:slug/approve` (Hono)
- `GET /health` (Hono)
- `GET /v1/auth/profile` (Hono)
- `POST /v1/auth/refresh` (Hono)
- `POST /v1/auth/sign-in` (Hono)
- `POST /v1/auth/sign-up` (Hono)
- `DELETE /v1/auth/users/:userId/subscribe` (Hono)
- `POST /v1/auth/users/:userId/subscribe` (Hono)
- `GET /v1/substacks` (Hono)
- `POST /v1/substacks` (Hono)
- `GET /v1/substacks/:slug` (Hono)
- `DELETE /v1/substacks/:slug/subscribe` (Hono)
- `POST /v1/substacks/:slug/subscribe` (Hono)

### Dashboard
- `GET /api/auth/$` (TanStack Start)
- `POST /api/auth/$` (TanStack Start)
- `GET /api/portal/auth/profile` (TanStack Start)
- `POST /api/portal/auth/sign-in` (TanStack Start)
- `POST /api/portal/auth/sign-out` (TanStack Start)
- `POST /api/portal/auth/sign-up` (TanStack Start)

### Job Service
- `GET /` (Fastify)
- `GET /health` (Fastify)
- `PATCH /v1/applications/:id/status` (Fastify)
- `GET /v1/jobs` (Fastify)
- `POST /v1/jobs` (Fastify)
- `DELETE /v1/jobs/:id` (Fastify)
- `GET /v1/jobs/:id` (Fastify)
- `PATCH /v1/jobs/:id` (Fastify)
- `GET /v1/jobs/:id/applications` (Fastify)
- `POST /v1/jobs/:id/applications` (Fastify)
- `GET /v1/me/applications` (Fastify)

### Notifications Service
- `GET /health` (Hono)
- `POST /internal/v1/notifications` (Hono)
- `POST /internal/v1/notifications/batch` (Hono)
- `GET /v1/notifications` (Hono)
- `PATCH /v1/notifications/:id/read` (Hono)

### Q&A Service
- `GET /` (NestJS)
- `POST /comments` (NestJS)
- `DELETE /comments/:id` (NestJS)
- `PATCH /comments/:id` (NestJS)
- `PATCH /comments/:id/accept` (NestJS)
- `POST /comments/:id/vote` (NestJS)
- `POST /topics` (NestJS)
- `DELETE /topics/:id` (NestJS)
- `GET /topics/:id` (NestJS)
- `PATCH /topics/:id` (NestJS)
- `GET /topics/:id/comments` (NestJS)
- `PATCH /topics/:id/solve` (NestJS)
- `POST /topics/:id/subscribe` (NestJS)
- `POST /topics/:id/unsubscribe` (NestJS)
- `DELETE /topics/:id/vote` (NestJS)
- `POST /topics/:id/vote` (NestJS)
- `GET /topics/search` (NestJS)

### Recommendation Service
- `GET /` (Fastify)
- `GET /health` (Fastify)
- `GET /internal/health` (Fastify)
- `GET /internal/metrics` (Fastify)
- `GET /internal/ready` (Fastify)
- `POST /internal/reindex/user/:userId` (Fastify)
- `GET /metrics` (Fastify)
- `GET /v1/feed` (Fastify)
- `GET /v1/health` (Fastify)
- `POST /v1/internal/events/comment` (Fastify)
- `POST /v1/internal/events/subscription` (Fastify)
- `POST /v1/internal/events/substack` (Fastify)
- `POST /v1/internal/events/topic` (Fastify)
- `POST /v1/internal/events/vote` (Fastify)
- `GET /v1/similar/topics/:id` (Fastify)
- `GET /v1/similar/users/:id` (Fastify)
- `GET /v1/topics/:id/similar` (Fastify)
- `GET /v1/trending` (Fastify)
- `GET /v1/users/:id/suggested-substacks` (Fastify)

## Function/Class API Families

### API Gateway
Thin public proxy layer for Auth and Notifications, plus cookie/upstream response helpers.

Representative callable/class APIs from the generated inventory:
- `initHono({ beforeInitRoutes, }: IInitHonoParams): IInitHonoReturn`
- `authMiddleware(c: Context<IApiGatewayContextVariables, string, {}>, next: Next): Promise<Response>`
- `setHttpOnly(c: Context, name: string, value: string, { secure = true, expires = '1h' }: ISetHttpOnlyOptions): void`
- `createUpstreamResponseHeaders(response: Response, { excludedHeaders = [] }: IForwardUpstreamResponseOptions): Headers`
- `forwardUpstreamResponse(c: Context, response: Response, options: IForwardUpstreamResponseOptions): Promise<Response>`
- `registerIoC(): IIoC`
- `AuthService.signUp(params: IAuthRequestParams): Promise<Response>`
- `AuthService.signIn(params: IAuthRequestParams): Promise<Response>`
- `AuthService.refresh(params: IAuthRequestParams): Promise<Response>`
- `AuthService.profile({ authToken }: IProfileParams): Promise<Response>`
- `AuthService.subscribeUser({ userId, authToken, }: IAuthenticatedRequestParams): Promise<Response>`
- `AuthService.unsubscribeUser({ userId, authToken, }: IAuthenticatedRequestParams): Promise<Response>`
- Additional generated callable APIs: 1. See `API_INVENTORY.md` for the full list.

### Auth Service
Identity, JWT/refresh token lifecycle, user follows, substacks, repositories, seeds, and notification integration.

Representative callable/class APIs from the generated inventory:
- `initHono({ beforeInitRoutes, }: IInitHonoParams): Promise<IInitHonoReturn>`
- `registerIoC({ drizzle }: IRegisterIoCParams): IIoC`
- `createDrizzle({ client, }: Pick<ICreateParams<typeof schema>, 'client'>): TDrizzle`
- `createRoles(drizzle: TDrizzle): Promise<void>`
- `createUsers(drizzle: TDrizzle): Promise<void>`
- `createSeedUsers(drizzle: TDrizzle): Promise<void>`
- `createSubstacks(drizzle: TDrizzle): Promise<void>`
- `seed(drizzle: TDrizzle): Promise<void>`
- `getRedis(): Promise<Redis>`
- `generateSalt(characterNumber: number): Promise<string>`
- `bcryptHash({ salt, source, }: IBcryptParams): Promise<IRBcryptHashProps>`
- `extractJWT({ token, secretKey = '' }: IExtractJWTParams, options: VerifyOptions): T`
- Additional generated callable APIs: 55. See `API_INVENTORY.md` for the full list.

### Dashboard
TanStack Start server routes and client auth APIs/hooks wrapping Gateway/Better Auth behavior.

Representative callable/class APIs from the generated inventory:
- `Footer(): Element`
- `Header(): Element`
- `Button({ className, variant = 'default', size = 'default', asChild = false, ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean; }): Element`
- `Input({ className, type, ...props }: React.ComponentProps<'input'>): Element`
- `Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>): Element`
- `getCurrentUser(): Promise<TUserProfile | null>`
- `signOut(): Promise<null>`
- `signIn(data: TSignIn): Promise<TAuthPayload>`
- `signUp(data: TSignUp): Promise<TAuthPayload>`
- `signOutAuthResponse(): Response`
- `proxyAuthRequest(request: Request, path: '/v1/auth/sign-in' | '/v1/auth/sign-up'): Promise<Response>`
- `proxyAuthPayload(payload: unknown, request: Request, path: '/v1/auth/sign-in' | '/v1/auth/sign-up'): Promise<Response>`
- Additional generated callable APIs: 11. See `API_INVENTORY.md` for the full list.

### Job Service
Fastify app, job/application routes, PostgreSQL access, JWT validation, Redis outbox publisher.

Representative callable/class APIs from the generated inventory:
- `buildApp(): Promise<FastifyInstance<Server<typeof IncomingMessage, typeof ServerResponse>, IncomingMessage, ServerResponse<IncomingMessage>, FastifyBaseLogger, FastifyTypeProviderDefault>>`
- `jwtAlgorithms(): ['RS256'] | ['HS256']`
- `resolveJwtSecret(_request: FastifyRequest, tokenOrHeader: TokenOrHeaderLike): Promise<string | Buffer>`
- `getJson(key: string): Promise<T | null>`
- `setJson(key: string, value: unknown, ttlSeconds: number): Promise<void>`
- `delKeys(keys: string[]): Promise<void>`
- `singleFlight(lockKey: string, cacheKey: string, load: () => Promise<T>): Promise<T>`
- `rateLimitApply(userId: string, limit: number, windowSeconds: number): Promise<void>`
- `getRedis(): Promise<Redis>`
- `withTransaction(fn: (client: PgClient) => Promise<T>): Promise<T>`
- `applicationRoutes(app: FastifyInstance): Promise<void>`
- `HttpError`
- Additional generated callable APIs: 5. See `API_INVENTORY.md` for the full list.

### Notifications Service
Portal/internal notification routes, notification commands/queries, Mongo repository, system notification mapping.

Representative callable/class APIs from the generated inventory:
- `initHono({ beforeInitRoutes, }: IInitHonoParams): Promise<IInitHonoReturn>`
- `registerIoC({ mongoose }: IRegisterIoCParams): IIoC`
- `createMongoose({ uri = process.env.MONGODB_URI, }: { uri?: string; }): Promise<TMongoose>`
- `registerNotificationIoC(): INotificationIoC`
- `CreateNotificationCommand.exec(params: TCreateNotification): Promise<NotificationEntity>`
- `MarkNotificationAsReadCommand.exec({ id, userId, }: IMarkNotificationAsReadParams): Promise<NotificationEntity | null>`
- `GetNotificationsQuery.exec({ read, limit, userId, }: IFindNotificationsParams): Promise<NotificationEntity[]>`
- `createAnswerVoteNotificationBody(action: 'upvoted' | 'downvoted', topicTitle: string): string`
- `createTopicVoteNotificationBody(action: 'upvoted' | 'downvoted', topicTitle: string): string`
- `createSocialUserSubscribedNotificationBody(actorName: string): string`
- `createSubstackApprovedNotificationBody(substackName: string): string`
- `createSubstackCreatedNotificationBody(substackName: string): string`
- Additional generated callable APIs: 6. See `API_INVENTORY.md` for the full list.

### Q&A Service
Nest controllers/services/DTOs/schemas for topics, comments, voting, subscriptions, MongoDB, and Elasticsearch search.

Representative callable/class APIs from the generated inventory:
- `AppController.getHello(): string`
- `AppModule`
- `AppService.getHello(): string`
- `CommentsController.deleteComment(id: string, user_id: string): Promise<{ message: string; }>`
- `CommentsController.voteComment(id: string, dto: VoteCommentDto): Promise<{ message: string; }>`
- `CommentsController.createComment(dto: CreateCommentDto): Promise<{ id: ObjectId; topic_id: string; user_id: string; content: string; is_accepted: boolean; created_at: any; updated_at: any; }>`
- `CommentsController.acceptComment(id: string, topic_id: string, user_id: string): Promise<{ id: ObjectId; topic_id: string; user_id: string; content: string; is_accepted: boolean; created_at: any; updated_at: any; }>`
- `CommentsController.updateComment(id: string, dto: UpdateCommentDto): Promise<{ id: ObjectId; topic_id: string; user_id: string; content: string; is_accepted: boolean; created_at: any; updated_at: any; }>`
- `CommentsModule`
- `CommentsRepo.create(data: Partial<Comment>): Promise<Document<unknown, {}, Comment, {}, DefaultSchemaOptions> & Comment & Required<{ _id: ObjectId; }> & { __v: number; } & { id: string; }>`
- `CommentsRepo.update(id: string, data: Partial<Comment>): Promise<Document<unknown, {}, Comment, {}, DefaultSchemaOptions> & Comment & Required<{ _id: ObjectId; }> & { __v: number; } & { id: string; }>`
- `CommentsRepo.softDelete(id: string): Promise<Document<unknown, {}, Comment, {}, DefaultSchemaOptions> & Comment & Required<{ _id: ObjectId; }> & { __v: number; } & { id: string; }>`
- Additional generated callable APIs: 86. See `API_INVENTORY.md` for the full list.

### Recommendation Service
Fastify recommendation routes, Redis stream ingestion, Neo4j graph repository logic, ranking/scoring, BullMQ jobs, metrics.

Representative callable/class APIs from the generated inventory:
- `buildApp(): Promise<FastifyInstance<Server<typeof IncomingMessage, typeof ServerResponse>, IncomingMessage, ServerResponse<IncomingMessage>, FastifyBaseLogger, FastifyTypeProviderDefault>>`
- `invalidateTrending(): Promise<void>`
- `getCachedUserSubscriptions(userId: string): Promise<Set<string> | null>`
- `setCachedUserSubscriptions(userId: string, substackIds: Iterable<string>): Promise<void>`
- `getCachedFeed(userId: string, limit: number): Promise<FeedResponse | null>`
- `invalidateUserSubscriptions(userId: string): Promise<void>`
- `setCachedFeed(userId: string, limit: number, feed: FeedResponse): Promise<void>`
- `invalidateUserFeed(userId: string): Promise<void>`
- `acquireFeedLock(userId: string): Promise<string | null>`
- `releaseFeedLock(userId: string, token: string): Promise<void>`
- `waitForCachedFeed(userId: string, limit: number, attempts: number, delayMs: number): Promise<FeedResponse | null>`
- `getCachedTrending(substackId: string | null): Promise<T[] | null>`
- Additional generated callable APIs: 51. See `API_INVENTORY.md` for the full list.

### Shared Domain - Auth
Auth/substack/user schemas, entities, repository contracts, and domain errors.

Representative callable/class APIs from the generated inventory:
- `AllowedTokenEntity.create(params: TAllowedTokenEntity): AllowedTokenEntity`
- `RoleEntity.create(params: TRoleEntity): RoleEntity`
- `SubstackEntity.create(params: TSubstackEntity): SubstackEntity`
- `SubstackRoleAssignmentEntity.create(params: TSubstackRoleAssignmentEntity): SubstackRoleAssignmentEntity`
- `SubstackRoleEntity.create(params: TSubstackRoleEntity): SubstackRoleEntity`
- `SubstackSubscriptionEntity.create(params: TSubstackSubscriptionEntity): SubstackSubscriptionEntity`
- `UserEntity.create(params: TUserEntity): UserEntity`
- `UserEntity.isAdmin(): boolean`
- `UserEntity.toProfile(): TUserProfile`
- `UserSubscriptionEntity.create(params: TUserSubscriptionEntity): UserSubscriptionEntity`

### Shared Domain - Notification
Notification schema, entity, and repository contract.

Representative callable/class APIs from the generated inventory:
- `NotificationEntity.create(params: TNotificationEntity): NotificationEntity`

### Shared Node - Hono
Reusable Hono middleware for IoC, Drizzle, Mongoose, internal auth, and logging.

Representative callable/class APIs from the generated inventory:
- `createDrizzleMiddleware({ drizzle, }: ICreateDrizzleMiddlewareParams<TDrizzle>): ReturnType< typeof createMiddleware<ICoreDrizzleContextVariables<TDrizzle>> >`
- `internalAuthMiddleware({ secret, }: IInternalAuthMiddlewareParams): ReturnType<typeof createMiddleware<Env>>`
- `createLoggerMiddleware({ serverName, }: ICreateLoggerMiddlewareParams): ReturnType<typeof createMiddleware<Env>>`
- `createMongooseMiddleware({ mongoose, }: ICreateMongooseMiddlewareParams<TMongoose>): ReturnType< typeof createMiddleware<ICoreMongooseContextVariables<TMongoose>> >`
- `createRegisterIoCMiddleware({ ioc, }: ICreateRegisterIoCMiddlewareParams<TIoC>): ReturnType< typeof createMiddleware<Env> >`

### Shared Node - Utils
Shared pagination utility.

Representative callable/class APIs from the generated inventory:
- `parsePagy({ limit, page }: IParsePagyParams): IParsedPagy`

## Architecture-Relevant Conclusions From API Surface

1. Gateway API surface is small and proxy-oriented. It currently exposes Auth and Notifications, but not Q&A, Job Service, or RecSys, which means browser-facing API ownership is split.
2. Auth is a broad domain boundary. It owns identity and substack/follow APIs, and it also calls Notifications, so auth changes can affect multiple service flows.
3. Q&A has the largest Nest/service/DTO surface and direct MongoDB plus Elasticsearch dependencies. Search indexing is part of user-facing write paths.
4. RecSys has a complete standalone API and function surface, but it is not wired into the gateway or source event producers in the current repo.
5. Job Service uses its own Fastify/JWT/database/outbox stack and currently publishes a separate `jobs.events` stream, not the RecSys `events:*` streams.
6. Shared packages expose domain schemas/entities/repository contracts, but cross-service runtime contracts such as JWT subject, current user propagation, and event envelopes are not yet centralized.

## Source Artifacts

- Full REST and exported callable list: `API_INVENTORY.md`.
- Raw TypeDoc declaration model: `API_TYPEDOC.json`.
- Architecture summary: `ARCHITECTURE.md`.
