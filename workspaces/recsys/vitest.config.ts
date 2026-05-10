// biome-ignore-all lint/style/useNamingConvention: Vitest env keys mirror process.env names.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'recsys',
    environment: 'node',
    env: {
      INTERNAL_SERVICE_SECRET: 'dev-internal-secret',
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
      exclude: ['src/index.ts'],
    },
  },
});
