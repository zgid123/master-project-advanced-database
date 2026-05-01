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
  LOG_LEVEL: z.string().default('info'),
  PG_POOL_MAX: z.coerce.number().int().positive().default(20),
  PG_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
});

const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,
  databaseUrl: env.DATABASE_URL,
  directDatabaseUrl: env.DIRECT_DB_URL ?? env.DATABASE_URL,
  redisUrl: env.REDIS_URL,
  jwtSecret: env.JWT_PUBLIC_KEY ?? env.JWT_SECRET,
  logLevel: env.LOG_LEVEL,
  pgPoolMax: env.PG_POOL_MAX,
  pgPoolMin: env.PG_POOL_MIN,
} as const;
