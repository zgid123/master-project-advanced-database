import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'job-service',
    environment: 'node',
    env: {
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
      exclude: ['src/index.ts', 'src/types/**'],
    },
  },
});
