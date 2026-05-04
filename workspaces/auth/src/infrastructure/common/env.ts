import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const isTest = !!process.env.VITEST_WORKER_ID;

if (!isTest) {
  config({
    path: '.env',
  });

  config({
    path:
      process.env.NODE_ENV === 'production'
        ? '.env.production.local'
        : '.env.local',
  });
} else {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const serverRoot = resolve(currentDir, '../../..');

  config({
    path: resolve(serverRoot, '.env.test'),
  });

  config({
    path: '.env.test',
  });
}
