import type { Env } from 'hono';

export interface ICoreDrizzleContextVariables<TDrizzle> extends Env {
  // biome-ignore lint/style/useNamingConvention: hono typing
  Variables: {
    drizzle: TDrizzle;
  };
}
