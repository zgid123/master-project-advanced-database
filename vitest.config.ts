import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
    },
    globals: true,
    projects: [
      'packages/**/vitest.config.ts',
      'workspaces/**/vitest.config.ts',
    ],
    reporters: 'tree',
  },
});
