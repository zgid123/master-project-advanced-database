// biome-ignore-all lint/style/useNamingConvention: process.env keys use uppercase names.
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3020),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('info'),
  INTERNAL_SERVICE_SECRET: z.string().default('dev-internal-secret'),

  NEO4J_URI: z.string().default('bolt://localhost:7687'),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().default('recsys-password'),
  NEO4J_DATABASE: z.string().default('neo4j'),
  NEO4J_POOL_SIZE: z.coerce.number().int().positive().default(100),
  NEO4J_CONNECTION_ACQUISITION_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(5_000),
  NEO4J_MAX_TRANSACTION_RETRY_TIME_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15_000),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  FEED_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  TRENDING_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  USER_SUBS_CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(1_800),
  POPULARITY_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(600),

  EVENTS_CONSUMER_GROUP: z.string().default('recsys'),
  EVENTS_CONSUMER_NAME: z.string().default(`recsys-${process.pid}`),
  EVENTS_BATCH_SIZE: z.coerce.number().int().positive().default(500),
  EVENTS_BLOCK_MS: z.coerce.number().int().nonnegative().default(2_000),
  EVENTS_VOTE_STREAM: z.string().default('events:vote'),
  EVENTS_SUBSCRIPTION_STREAM: z.string().default('events:subscription'),
  EVENTS_TOPIC_STREAM: z.string().default('events:topic'),
  EVENTS_COMMENT_STREAM: z.string().default('events:comment'),
  EVENTS_SUBSTACK_STREAM: z.string().default('events:substack'),

  JOB_QUEUE_NAME: z.string().default('recsys.batch'),
  POPULARITY_REFRESH_CRON: z.string().default('*/10 * * * *'),
  SIMILARITY_REFRESH_CRON: z.string().default('0 2 * * *'),
});

const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,
  logLevel: env.LOG_LEVEL,
  internalServiceSecret: env.INTERNAL_SERVICE_SECRET,

  neo4jUri: env.NEO4J_URI,
  neo4jUser: env.NEO4J_USER,
  neo4jPassword: env.NEO4J_PASSWORD,
  neo4jDatabase: env.NEO4J_DATABASE,
  neo4jPoolSize: env.NEO4J_POOL_SIZE,
  neo4jConnectionAcquisitionTimeoutMs:
    env.NEO4J_CONNECTION_ACQUISITION_TIMEOUT_MS,
  neo4jMaxTransactionRetryTimeMs: env.NEO4J_MAX_TRANSACTION_RETRY_TIME_MS,

  redisUrl: env.REDIS_URL,
  feedCacheTtlSeconds: env.FEED_CACHE_TTL_SECONDS,
  trendingCacheTtlSeconds: env.TRENDING_CACHE_TTL_SECONDS,
  userSubsCacheTtlSeconds: env.USER_SUBS_CACHE_TTL_SECONDS,
  popularityCacheTtlSeconds: env.POPULARITY_CACHE_TTL_SECONDS,

  events: {
    consumerGroup: env.EVENTS_CONSUMER_GROUP,
    consumerName: env.EVENTS_CONSUMER_NAME,
    batchSize: env.EVENTS_BATCH_SIZE,
    blockMs: env.EVENTS_BLOCK_MS,
    streams: {
      vote: env.EVENTS_VOTE_STREAM,
      subscription: env.EVENTS_SUBSCRIPTION_STREAM,
      topic: env.EVENTS_TOPIC_STREAM,
      comment: env.EVENTS_COMMENT_STREAM,
      substack: env.EVENTS_SUBSTACK_STREAM,
    },
  },

  jobs: {
    queueName: env.JOB_QUEUE_NAME,
    popularityRefreshCron: env.POPULARITY_REFRESH_CRON,
    similarityRefreshCron: env.SIMILARITY_REFRESH_CRON,
  },
} as const;
