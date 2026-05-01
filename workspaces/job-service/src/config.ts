import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3010),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgres://jobsvc:jobsvc@localhost:6432/jobs'),
  DIRECT_DB_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('dev-secret'),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_JWKS_URL: z.string().url().optional(),
  JWT_JWKS_CACHE_TTL_MS: z.coerce.number().int().positive().default(300_000),
  LOG_LEVEL: z.string().default('info'),
  PG_POOL_MAX: z.coerce.number().int().positive().default(20),
  PG_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
  PG_POOL_MAX_USES: z.coerce.number().int().positive().default(7_500),
});

const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,
  databaseUrl: env.DATABASE_URL,
  directDatabaseUrl: env.DIRECT_DB_URL ?? env.DATABASE_URL,
  redisUrl: env.REDIS_URL,
  jwtSecret: env.JWT_SECRET,
  jwtPublicKey: env.JWT_PUBLIC_KEY,
  jwtJwksUrl: env.JWT_JWKS_URL,
  jwtJwksCacheTtlMs: env.JWT_JWKS_CACHE_TTL_MS,
  logLevel: env.LOG_LEVEL,
  pgPoolMax: env.PG_POOL_MAX,
  pgPoolMin: env.PG_POOL_MIN,
  pgPoolMaxUses: env.PG_POOL_MAX_USES,
} as const;
