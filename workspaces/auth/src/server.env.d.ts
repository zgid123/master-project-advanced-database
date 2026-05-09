/** biome-ignore-all lint/style/useNamingConvention: ignore */

declare namespace NodeJS {
  export interface ProcessEnv {
    DB_NAME: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_USER: string;
    JWT_ALG: string;
    JWT_SECRET: string;
    DB_PASSWORD: string;
    ADMIN_EMAIL: string;
    ADMIN_PASSWORD: string;
    INTERNAL_SERVICE_SECRET?: string;
    NOTIFICATIONS_SERVICE_URL?: string;
    NODE_ENV: 'development' | 'production' | 'staging' | 'test';
  }
}
