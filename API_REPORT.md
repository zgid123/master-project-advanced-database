# API Report

Generated: 2026-05-13T01:38:11.328Z

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
| API Gateway | 20 | 28 | 18 | Public proxy for Auth, Notifications, public substacks, and Q&A topic/comment routes. |
| Auth Service | 74 | 15 | 71 | Identity, JWT/refresh lifecycle, user follows, substacks, repositories, seeds, and notification integration. |
| Dashboard | 65 | 5 | 52 | TanStack Start UI, auth proxy routes, substack list/detail pages, and client/server API wrappers. |
| Job Service | 25 | 12 | 24 | Fastify app, job/application routes, MongoDB access, JWT validation, Redis outbox publisher. |
| Notifications Service | 27 | 5 | 18 | Portal/internal notification routes, notification commands/queries, Mongo repository, system notification mapping. |
| Q&A Service | 44 | 17 | 99 | Nest controllers/services/DTOs/schemas for topics, comments, voting, subscriptions, MongoDB, and Elasticsearch search. |
| Recommendation Service | 29 | 19 | 63 | Fastify recommendation routes, Redis stream ingestion, Neo4j graph logic, ranking/scoring, BullMQ jobs, metrics. |
| Shared Domain - Auth | 30 | 0 | 10 | Auth/substack/user schemas, entities, repository contracts, and domain errors. |
| Shared Domain - Notification | 7 | 0 | 1 | Notification schema, entity, and repository contract. |
| Shared Node - Hono | 8 | 0 | 5 | Reusable Hono middleware for IoC, Drizzle, Mongoose, internal auth, and logging. |
| Shared Node - Utils | 1 | 0 | 1 | Shared pagination utility. |

## TypeDoc Declaration Summary

| Component | Classes | Interfaces | Functions | Methods | Type aliases | Variables | Enums |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| API Gateway | 3 | 2 | 5 | 12 | 1 | 10 | 0 |
| Auth Service | 29 | 6 | 17 | 54 | 17 | 26 | 0 |
| Dashboard | 0 | 7 | 52 | 0 | 2 | 27 | 0 |
| Job Service | 1 | 0 | 18 | 0 | 15 | 22 | 0 |
| Notifications Service | 5 | 3 | 11 | 7 | 2 | 16 | 0 |
| Q&A Service | 40 | 0 | 0 | 71 | 0 | 19 | 0 |
| Recommendation Service | 1 | 0 | 62 | 0 | 16 | 18 | 0 |
| Shared Domain - Auth | 8 | 20 | 0 | 34 | 29 | 43 | 0 |
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
- `POST /v1/auth/sign-out` (Hono)
- `POST /v1/auth/sign-up` (Hono)
- `DELETE /v1/auth/users/:userId/subscribe` (Hono)
- `POST /v1/auth/users/:userId/subscribe` (Hono)
- `POST /v1/comments` (Hono)
- `DELETE /v1/comments/:id` (Hono)
- `PATCH /v1/comments/:id` (Hono)
- `PATCH /v1/comments/:id/accept` (Hono)
- `POST /v1/comments/:id/vote` (Hono)
- `GET /v1/notifications` (Hono)
- `GET /v1/substacks` (Hono)
- `GET /v1/substacks/:slug` (Hono)
- `GET /v1/substacks/total` (Hono)
- `POST /v1/topics` (Hono)
- `DELETE /v1/topics/:id` (Hono)
- `GET /v1/topics/:id` (Hono)
- `PATCH /v1/topics/:id` (Hono)
- `GET /v1/topics/:id/comments` (Hono)
- `PATCH /v1/topics/:id/solve` (Hono)
- `POST /v1/topics/:id/subscribe` (Hono)
- `POST /v1/topics/:id/unsubscribe` (Hono)
- `DELETE /v1/topics/:id/vote` (Hono)
- `POST /v1/topics/:id/vote` (Hono)
- `GET /v1/topics/search` (Hono)

### Auth Service
- `POST /admin/substacks/:slug/approve` (Hono)
- `GET /health` (Hono)
- `GET /v1/auth/profile` (Hono)
- `POST /v1/auth/refresh` (Hono)
- `POST /v1/auth/sign-in` (Hono)
- `POST /v1/auth/sign-out` (Hono)
- `POST /v1/auth/sign-up` (Hono)
- `DELETE /v1/auth/users/:userId/subscribe` (Hono)
- `POST /v1/auth/users/:userId/subscribe` (Hono)
- `GET /v1/substacks` (Hono)
- `POST /v1/substacks` (Hono)
- `GET /v1/substacks/:slug` (Hono)
- `DELETE /v1/substacks/:slug/subscribe` (Hono)
- `POST /v1/substacks/:slug/subscribe` (Hono)
- `GET /v1/substacks/total` (Hono)

### Dashboard
- `POST /api/auth/$` (TanStack Start)
- `GET /api/portal/auth/profile` (TanStack Start)
- `GET /api/portal/substacks/` (TanStack Start)
- `GET /api/portal/substacks/$slug` (TanStack Start)
- `GET /api/portal/substacks/total` (TanStack Start)

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
- `GET /v1/jobs/:id/me/application` (Fastify)
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
Public proxy for Auth, Notifications, public substacks, and Q&A topic/comment routes.

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
- `AuthService.signOut(params: IAuthRequestParams): Promise<Response>`
- `AuthService.profile({ authToken }: IProfileParams): Promise<Response>`
- `AuthService.subscribeUser({ userId, authToken, }: IAuthenticatedRequestParams): Promise<Response>`
- Additional generated callable APIs: 6. See `API_INVENTORY.md` for the full list.

### Auth Service
Identity, JWT/refresh lifecycle, user follows, substacks, repositories, seeds, and notification integration.

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
- Additional generated callable APIs: 59. See `API_INVENTORY.md` for the full list.

### Dashboard
TanStack Start UI, auth proxy routes, substack list/detail pages, and client/server API wrappers.

Representative callable/class APIs from the generated inventory:
- `AuthModal(): Element`
- `Footer(): Element`
- `Header(): Element`
- `Button({ className, variant = 'default', size = 'default', asChild = false, ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean; }): Element`
- `DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>): Element`
- `DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>): Element`
- `DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>): Element`
- `DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>): Element`
- `DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>): Element`
- `DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>): Element`
- `DialogContent({ className, children, showCloseButton = true, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean; }): Element`
- `Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>): Element`
- Additional generated callable APIs: 40. See `API_INVENTORY.md` for the full list.

### Job Service
Fastify app, job/application routes, MongoDB access, JWT validation, Redis outbox publisher.

Representative callable/class APIs from the generated inventory:
- `buildApp(): Promise<FastifyInstance<Server<typeof IncomingMessage, typeof ServerResponse>, IncomingMessage, ServerResponse<IncomingMessage>, FastifyBaseLogger, FastifyTypeProviderDefault>>`
- `jwtAlgorithms(): ['RS256'] | ['HS256']`
- `resolveJwtSecret(_request: FastifyRequest, tokenOrHeader: TokenOrHeaderLike): Promise<string | Buffer>`
- `getJson(key: string): Promise<T | null>`
- `getJsonWithTtl(key: string): Promise<{ value: T | null; ttlMs: number | null }>`
- `setJson(key: string, value: unknown, ttlSeconds: number): Promise<void>`
- `delKeys(...keys: string[]): Promise<void>`
- `singleFlight(lockKey: string, cacheKey: string, load: () => Promise<T>, options: { forceRefresh?: boolean }): Promise<T>`
- `shouldRefreshEarly(ttlMs: number | null, ttlSeconds: number): boolean`
- `rateLimitApply(userId: string, limit: number, windowSeconds: number): Promise<void>`
- `getRedis(): Promise<Redis>`
- `getMongoClient(): Promise<MongoClient>`
- `getDb(): Promise<Db>`
- `withMongoTransaction(fn: (session: ClientSession) => Promise<T>): Promise<T>`
- `closeMongo(): Promise<void>`
- `applicationRoutes(app: FastifyInstance): Promise<void>`
- `HttpError`
- Additional generated callable APIs: 7. See `API_INVENTORY.md` for the full list.

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
- `CommentsController.voteComment(id: string, dto: VoteCommentDto, user_id: string): Promise<{ message: string; }>`
- `CommentsController.createComment(dto: CreateCommentDto, user_id: string): Promise<{ id: ObjectId; topic_id: string; user_id: string; content: string; is_accepted: boolean; created_at: any; updated_at: any; }>`
- `CommentsController.acceptComment(id: string, topic_id: string, user_id: string): Promise<{ id: ObjectId; topic_id: string; user_id: string; content: string; is_accepted: boolean; created_at: any; updated_at: any; }>`
- `CommentsController.updateComment(id: string, dto: UpdateCommentDto, user_id: string): Promise<{ id: ObjectId; topic_id: string; user_id: string; content: string; is_accepted: boolean; created_at: any; updated_at: any; }>`
- `CommentsModule`
- `CommentsRepo.create(data: Partial<Comment>): Promise<Document<unknown, {}, Comment, {}, DefaultSchemaOptions> & Comment & Required<{ _id: ObjectId; }> & { __v: number; } & { id: string; }>`
- `CommentsRepo.update(id: string, data: Partial<Comment>): Promise<Document<unknown, {}, Comment, {}, DefaultSchemaOptions> & Comment & Required<{ _id: ObjectId; }> & { __v: number; } & { id: string; }>`
- `CommentsRepo.softDelete(id: string): Promise<Document<unknown, {}, Comment, {}, DefaultSchemaOptions> & Comment & Required<{ _id: ObjectId; }> & { __v: number; } & { id: string; }>`
- Additional generated callable APIs: 87. See `API_INVENTORY.md` for the full list.

### Recommendation Service
Fastify recommendation routes, Redis stream ingestion, Neo4j graph logic, ranking/scoring, BullMQ jobs, metrics.

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

1. The current generated surface is 101 REST/server routes and 361 exported callable/class APIs.
2. API Gateway now fronts Auth, Notifications, public Substacks, and Q&A topic/comment routes. Job Service and RecSys remain outside the gateway.
3. Auth remains the owner of users, follows, substacks, and token lifecycle; recent frontend auth work moved more browser workflows through Dashboard and Gateway.
4. Dashboard now includes auth, substack list/detail pages, and server proxy routes for auth/substack APIs.
5. Q&A is integrated through Gateway for topics/comments, but it still owns its NestJS controllers, MongoDB models, and Elasticsearch indexing.
6. RecSys remains a standalone recommendation service with internal event ingestion; no generated route shows a Gateway proxy to RecSys.
7. Shared packages expose domain schemas/entities/repository contracts, but cross-service runtime contracts such as JWT subject, current user propagation, and event envelopes still need one canonical definition.

## Source Artifacts

- Full REST and exported callable list: `API_INVENTORY.md`.
- Raw TypeDoc declaration model: `API_TYPEDOC.json`.
- Architecture summary: `ARCHITECTURE.md`.
