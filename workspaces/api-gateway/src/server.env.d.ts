/** biome-ignore-all lint/style/useNamingConvention: ignore */

declare namespace NodeJS {
  export interface ProcessEnv {
    PORT?: string;
    AUTH_SERVICE_URL?: string;
    VITEST_WORKER_ID?: string;
    NOTIFICATIONS_SERVICE_URL?: string;
    NODE_ENV: 'development' | 'production' | 'staging' | 'test';
  }
}
