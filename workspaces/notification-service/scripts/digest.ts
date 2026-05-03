import { digestQueue } from '../src/workers/queues.js';

const arg = process.argv[2] ?? 'daily';
const kind = arg === 'weekly' ? 'weekly_digest' : 'daily_digest';
const windowHours = kind === 'weekly_digest' ? 24 * 7 : 24;

await digestQueue.add(kind, {
  kind,
  window_hours: windowHours,
}, {
  jobId: `${kind}:${new Date().toISOString().slice(0, 10)}`,
});

await digestQueue.close();
console.log(`${kind} job queued`);
