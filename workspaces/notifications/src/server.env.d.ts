/** biome-ignore-all lint/style/useNamingConvention: ignore */

declare namespace NodeJS {
  export interface ProcessEnv {
    MONGODB_URI?: string;
    INTERNAL_SERVICE_SECRET?: string;
    NODE_ENV: 'development' | 'production' | 'staging' | 'test';
  }
}
