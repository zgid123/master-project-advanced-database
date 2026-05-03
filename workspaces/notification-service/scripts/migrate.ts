import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import { config } from '../src/config.js';

const action = process.argv[2] ?? 'up';
const migrationsDir = path.resolve(process.cwd(), 'src/db/migrations');

if (!['up', 'down'].includes(action)) {
  throw new Error('Usage: tsx scripts/migrate.ts [up|down]');
}

const client = new Client({
  connectionString: config.directDatabaseUrl,
  application_name: 'notification-service-migrator',
});

async function ensureMigrationsTable(): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function appliedMigrationNames(): Promise<Set<string>> {
  const result = await client.query<{ name: string }>('SELECT name FROM _migrations');
  return new Set(result.rows.map((row) => row.name));
}

async function migrateUp(): Promise<void> {
  const applied = await appliedMigrationNames();
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.up.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    console.log(`applying ${file}`);
    await client.query('BEGIN');
    try {
      await client.query(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
      await client.query('INSERT INTO _migrations(name) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
}

async function migrateDown(): Promise<void> {
  const result = await client.query<{ name: string }>(
    'SELECT name FROM _migrations ORDER BY name DESC LIMIT 1',
  );
  const last = result.rows[0]?.name;

  if (!last) {
    console.log('no migrations to roll back');
    return;
  }

  const downFile = last.replace('.up.sql', '.down.sql');
  const downPath = path.join(migrationsDir, downFile);

  if (!fs.existsSync(downPath)) {
    throw new Error(`Missing down migration: ${downFile}`);
  }

  console.log(`rolling back ${last}`);
  await client.query('BEGIN');
  try {
    await client.query(fs.readFileSync(downPath, 'utf8'));
    await client.query('DELETE FROM _migrations WHERE name = $1', [last]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

await client.connect();
try {
  await ensureMigrationsTable();
  if (action === 'up') {
    await migrateUp();
  } else {
    await migrateDown();
  }
} finally {
  await client.end();
}
