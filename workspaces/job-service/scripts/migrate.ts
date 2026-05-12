import { closeMongo, getDb } from '../src/db/mongo.js';
import { down, up } from '../src/db/migrations/001_indexes.js';

const action = process.argv[2] ?? 'up';

if (!['up', 'down'].includes(action)) {
  throw new Error('Usage: tsx scripts/migrate.ts [up|down]');
}

const db = await getDb();

try {
  if (action === 'up') {
    await up(db);
    console.log('applied MongoDB job-service validators and indexes');
  } else {
    await down(db);
    console.log('rolled back MongoDB job-service indexes');
  }
} finally {
  await closeMongo();
}
