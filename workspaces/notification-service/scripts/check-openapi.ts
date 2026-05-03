process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

const [{ buildApp }, { pool }] = await Promise.all([
  import('../src/app.js'),
  import('../src/db/pool.js'),
]);

const requiredPaths = [
  '/health',
  '/metrics',
  '/v1/notifications',
  '/v1/notifications/unread-count',
  '/v1/preferences',
  '/v1/devices',
  '/internal/notifications/events',
] as const;

const app = await buildApp();
let exitCode = 0;

async function closeWithDiagnostics(label: string, close: () => Promise<unknown>): Promise<void> {
  try {
    await close();
  } catch (error) {
    exitCode = 1;
    console.error(`${label} failed`, error);
  }
}

try {
  await app.ready();
  const response = await app.inject({ method: 'GET', url: '/docs/json' });

  if (response.statusCode !== 200) {
    throw new Error(`OpenAPI JSON returned HTTP ${response.statusCode}`);
  }

  const document = response.json<{
    openapi?: string;
    paths?: Record<string, unknown>;
    components?: {
      securitySchemes?: Record<string, unknown>;
    };
  }>();

  if (!document.openapi?.startsWith('3.')) {
    throw new Error('OpenAPI document version is missing or unsupported');
  }

  for (const path of requiredPaths) {
    if (!document.paths?.[path]) {
      throw new Error(`OpenAPI path is missing: ${path}`);
    }
  }

  if (!document.components?.securitySchemes?.bearerAuth) {
    throw new Error('OpenAPI bearerAuth security scheme is missing');
  }

  if (!document.components.securitySchemes.internalToken) {
    throw new Error('OpenAPI internalToken security scheme is missing');
  }

  console.log(`OpenAPI check passed with ${Object.keys(document.paths ?? {}).length} paths`);
} catch (error) {
  exitCode = 1;
  console.error(error instanceof Error ? error.message : error);
} finally {
  await closeWithDiagnostics('app.close', () => app.close());
  await closeWithDiagnostics('pool.end', () => pool.end());
}

process.exit(exitCode);
