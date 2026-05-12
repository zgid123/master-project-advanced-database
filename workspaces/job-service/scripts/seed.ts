import { parseArgs } from 'node:util';
import { Int32, ObjectId, type AnyBulkWriteOperation } from 'mongodb';
import { closeMongo, getDb } from '../src/db/mongo.js';
import type { ApplicationDoc } from '../src/domain/applications/application.types.js';
import type { JobDoc, JobStatus, JobType } from '../src/domain/jobs/job.types.js';

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
  'MongoDB Performance Engineer',
  'Node.js Platform Developer',
  'Full Stack Engineer',
  'Data Infrastructure Engineer',
];

const locations = ['Remote', 'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Singapore'];
const jobTypes: JobType[] = ['full_time', 'part_time', 'contract', 'internship'];
const tagPool = ['nodejs', 'mongodb', 'redis', 'typescript', 'fastify', 'database'];
const userIds = Array.from({ length: userCount }, () => new ObjectId());

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

async function insertJobs(): Promise<ObjectId[]> {
  const db = await getDb();
  const jobs = db.collection<JobDoc>('jobs');
  const jobIds: ObjectId[] = [];

  for (let offset = 0; offset < jobCount; offset += batchSize) {
    const rows = Math.min(batchSize, jobCount - offset);
    const batch: JobDoc[] = [];

    for (let index = 0; index < rows; index += 1) {
      const absoluteIndex = offset + index + 1;
      const title = `${pick(jobTitles)} ${absoluteIndex}`;
      const location = pick(locations);
      const _id = new ObjectId();
      jobIds.push(_id);

      batch.push({
        _id,
        postedByUserId: userIds[absoluteIndex % userIds.length] as ObjectId,
        title,
        content: `Seeded benchmark job ${absoluteIndex} focused on MongoDB and service performance.`,
        status: (absoluteIndex % 5 === 0 ? 'draft' : 'open') as JobStatus,
        jobType: pick(jobTypes),
        location,
        tags: [pick(tagPool), pick(tagPool)],
        applicationCount: new Int32(0) as unknown as number,
        metadata: {
          companyInfo: { name: `Company ${absoluteIndex % 1000}`, industry: 'software' },
          seniority: absoluteIndex % 3 === 0 ? 'senior' : 'mid',
          remote: location === 'Remote',
          salaryRangeUSD: {
            min: 40_000 + (absoluteIndex % 300) * 100,
            max: 80_000 + (absoluteIndex % 500) * 100,
          },
        },
        deletedAt: null,
        createdAt: new Date(Date.now() - absoluteIndex * 1000),
        updatedAt: new Date(),
      });
    }

    if (batch.length > 0) {
      await jobs.bulkWrite(
        batch.map((document) => ({ insertOne: { document } })),
        { ordered: false },
      );
    }

    console.log(`seeded jobs: ${Math.min(offset + rows, jobCount)}/${jobCount}`);
  }

  return jobIds;
}

async function insertApplications(jobIds: ObjectId[]): Promise<void> {
  if (jobIds.length === 0) {
    throw new Error('Seed jobs before applications');
  }

  const db = await getDb();
  const applications = db.collection<ApplicationDoc>('job_applications');
  const jobs = db.collection<JobDoc>('jobs');

  for (let offset = 0; offset < applicationCount; offset += batchSize) {
    const rows = Math.min(batchSize, applicationCount - offset);
    const ops: AnyBulkWriteOperation<ApplicationDoc>[] = [];

    for (let index = 0; index < rows; index += 1) {
      const absoluteIndex = offset + index + 1;
      const jobId = pick(jobIds);
      const applicantUserId = userIds[absoluteIndex % userIds.length] as ObjectId;
      const now = new Date();

      ops.push({
        insertOne: {
          document: {
            _id: new ObjectId(),
            jobId,
            applicantUserId,
            status: 'submitted',
            coverLetter: `Seed application ${absoluteIndex}`,
            idempotencyKey: `seed-${absoluteIndex}`,
            metadata: {
              source: 'seed',
              expectedSalary: 1_500 + (absoluteIndex % 300) * 10,
            },
            deletedAt: null,
            createdAt: now,
            updatedAt: now,
          },
        },
      });
    }

    if (ops.length > 0) {
      await applications.bulkWrite(ops, { ordered: false });
    }

    console.log(`seeded applications: ${Math.min(offset + rows, applicationCount)}/${applicationCount}`);
  }

  console.log('refreshing application counters');
  const counts = applications.aggregate<{ _id: ObjectId; count: number }>([
    { $match: { deletedAt: null } },
    { $group: { _id: '$jobId', count: { $sum: 1 } } },
  ]);

  const updates: AnyBulkWriteOperation<JobDoc>[] = [];
  for await (const count of counts) {
    updates.push({
      updateOne: {
        filter: { _id: count._id },
        update: { $set: { applicationCount: new Int32(count.count) as unknown as number, updatedAt: new Date() } },
      },
    });

    if (updates.length >= batchSize) {
      await jobs.bulkWrite(updates, { ordered: false });
      updates.length = 0;
    }
  }

  if (updates.length > 0) {
    await jobs.bulkWrite(updates, { ordered: false });
  }
}

try {
  const jobIds = await insertJobs();
  await insertApplications(jobIds);
} finally {
  await closeMongo();
}
