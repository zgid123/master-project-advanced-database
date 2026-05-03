import { parseArgs } from 'node:util';
import { Client } from 'pg';
import { config } from '../src/config.js';

const cliArgs = process.argv.slice(2);
if (cliArgs[0] === '--') {
  cliArgs.shift();
}

const { values } = parseArgs({
  args: cliArgs,
  options: {
    jobs: { type: 'string', default: '10000' },
    apps: { type: 'string', default: '50000' },
    users: { type: 'string' },
    batch: { type: 'string', default: '1000' },
  },
  allowPositionals: false,
});

const jobCount = Number(values.jobs);
const applicationCount = Number(values.apps);
const userCount = Number(values.users ?? Math.max(jobCount * 10, 10_000));
const batchSize = Number(values.batch);

if (![jobCount, applicationCount, userCount, batchSize].every(Number.isFinite)) {
  throw new Error('jobs, apps, users, and batch must be numeric');
}

const jobTitles = [
  'Senior Backend Engineer',
  'PostgreSQL Performance Engineer',
  'Node.js Platform Developer',
  'Full Stack Engineer',
  'Data Infrastructure Engineer',
];

const locations = ['Remote', 'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Singapore'];
const jobTypes = ['full_time', 'part_time', 'contract', 'internship', 'freelance'];
const tagPool = ['nodejs', 'postgres', 'redis', 'typescript', 'fastify', 'database'];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function slug(value: string, index: number): string {
  return `${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${index}`;
}

function placeholders(rows: number, columns: number): string {
  const parts: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    const values: string[] = [];
    for (let column = 0; column < columns; column += 1) {
      values.push(`$${row * columns + column + 1}`);
    }
    parts.push(`(${values.join(', ')})`);
  }
  return parts.join(', ');
}

async function insertJobs(client: Client): Promise<void> {
  for (let offset = 0; offset < jobCount; offset += batchSize) {
    const rows = Math.min(batchSize, jobCount - offset);
    const params: unknown[] = [];

    for (let index = 0; index < rows; index += 1) {
      const absoluteIndex = offset + index + 1;
      const title = pick(jobTitles);
      const location = pick(locations);
      const selectedTags = [pick(tagPool), pick(tagPool)];
      params.push(
        String((absoluteIndex % userCount) + 1),
        `${title} ${absoluteIndex}`,
        slug(title, absoluteIndex),
        `Seeded benchmark job ${absoluteIndex} focused on PostgreSQL and service performance.`,
        absoluteIndex % 5 === 0 ? 'draft' : 'open',
        pick(jobTypes),
        location,
        1_000 + (absoluteIndex % 300) * 10,
        2_000 + (absoluteIndex % 500) * 10,
        'USD',
        selectedTags,
        JSON.stringify({
          company: `Company ${absoluteIndex % 1000}`,
          experience_years: absoluteIndex % 8,
          remote_policy: location === 'Remote' ? 'remote' : 'hybrid',
        }),
      );
    }

    await client.query(
      `
        INSERT INTO jobs (
          posted_by_user_id, name, slug, content, status, job_type, location,
          salary_min, salary_max, currency, tags, metadata
        )
        VALUES ${placeholders(rows, 12)}
        ON CONFLICT (slug) DO NOTHING
      `,
      params,
    );

    console.log(`seeded jobs: ${Math.min(offset + rows, jobCount)}/${jobCount}`);
  }
}

async function insertApplications(client: Client): Promise<void> {
  const range = await client.query<{ min: string; max: string }>('SELECT min(id), max(id) FROM jobs');
  const minJobId = Number(range.rows[0]?.min);
  const maxJobId = Number(range.rows[0]?.max);

  if (!Number.isFinite(minJobId) || !Number.isFinite(maxJobId)) {
    throw new Error('Seed jobs before applications');
  }

  for (let offset = 0; offset < applicationCount; offset += batchSize) {
    const rows = Math.min(batchSize, applicationCount - offset);
    const params: unknown[] = [];

    for (let index = 0; index < rows; index += 1) {
      const absoluteIndex = offset + index + 1;
      const jobId = minJobId + Math.floor(Math.random() * (maxJobId - minJobId + 1));
      const applicantUserId = (absoluteIndex % userCount) + 1;
      params.push(
        String(jobId),
        String(applicantUserId),
        `Seed application ${absoluteIndex}`,
        JSON.stringify({
          source: 'seed',
          expected_salary: 1_500 + (absoluteIndex % 300) * 10,
        }),
        `seed-${absoluteIndex}`,
      );
    }

    await client.query(
      `
        INSERT INTO job_applications (
          job_id, applicant_user_id, content, metadata, idempotency_key
        )
        VALUES ${placeholders(rows, 5)}
        ON CONFLICT DO NOTHING
      `,
      params,
    );

    console.log(`seeded applications: ${Math.min(offset + rows, applicationCount)}/${applicationCount}`);
  }
}

const client = new Client({
  connectionString: config.directDatabaseUrl,
  application_name: 'job-service-seed',
});

await client.connect();
try {
  await insertJobs(client);
  await insertApplications(client);
  console.log('refreshing application counters');
  await client.query(`
    UPDATE jobs
    SET application_count = counts.count
    FROM (
      SELECT job_id, count(*)::int AS count
      FROM job_applications
      GROUP BY job_id
    ) counts
    WHERE jobs.id = counts.job_id
  `);
  await client.query('VACUUM ANALYZE jobs');
  await client.query('VACUUM ANALYZE job_applications');
} finally {
  await client.end();
}
