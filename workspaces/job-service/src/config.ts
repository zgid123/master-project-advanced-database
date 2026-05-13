import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3010),
  HOST: z.string().default('0.0.0.0'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/jobs?replicaSet=rs0&directConnection=true'),
  MONGODB_DB_NAME: z.string().default('jobs'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('dev-secret'),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_JWKS_URL: z.string().url().optional(),
  JWT_JWKS_CACHE_TTL_MS: z.coerce.number().int().positive().default(300_000),
  JWT_JWKS_NEGATIVE_CACHE_TTL_MS: z.coerce.number().int().positive().default(30_000),
  LOG_LEVEL: z.string().default('info'),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().default(50),
  MONGODB_MIN_POOL_SIZE: z.coerce.number().int().nonnegative().default(5),
  MONGODB_MAX_IDLE_TIME_MS: z.coerce.number().int().positive().default(60_000),
  MONGODB_MAX_CONNECTING: z.coerce.number().int().positive().default(4),
  MONGODB_WAIT_QUEUE_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
});

const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,
  mongodbUri: env.MONGODB_URI,
  mongodbDbName: env.MONGODB_DB_NAME,
  redisUrl: env.REDIS_URL,
  jwtSecret: env.JWT_SECRET,
  jwtPublicKey: env.JWT_PUBLIC_KEY,
  jwtJwksUrl: env.JWT_JWKS_URL,
  jwtJwksCacheTtlMs: env.JWT_JWKS_CACHE_TTL_MS,
  jwtJwksNegativeCacheTtlMs: env.JWT_JWKS_NEGATIVE_CACHE_TTL_MS,
  logLevel: env.LOG_LEVEL,
  mongodbMaxPoolSize: env.MONGODB_MAX_POOL_SIZE,
  mongodbMinPoolSize: env.MONGODB_MIN_POOL_SIZE,
  mongodbMaxIdleTimeMs: env.MONGODB_MAX_IDLE_TIME_MS,
  mongodbMaxConnecting: env.MONGODB_MAX_CONNECTING,
  mongodbWaitQueueTimeoutMs: env.MONGODB_WAIT_QUEUE_TIMEOUT_MS,
} as const;
