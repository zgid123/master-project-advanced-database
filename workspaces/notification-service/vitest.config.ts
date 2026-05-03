import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'notification-service',
    environment: 'node',
    env: {
      JWT_SECRET: 'dev-secret',
      LOG_LEVEL: 'silent',
      NODE_ENV: 'test',
    },
    globals: false,
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/types/**', 'src/workers/**', 'src/events/**', 'src/realtime/**'],
    },
  },
});
