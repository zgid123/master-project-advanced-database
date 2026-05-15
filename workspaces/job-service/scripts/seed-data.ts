import 'dotenv/config';
import { Int32, ObjectId } from 'mongodb';

import { closeMongo, getDb } from '../src/db/mongo.js';
import type { ApplicationDoc } from '../src/domain/applications/application.types.js';
import type {
  JobDoc,
  JobStatus,
  JobType,
} from '../src/domain/jobs/job.types.js';

const jobTitles = [
  'Senior Backend Engineer',
  'MongoDB Performance Engineer',
  'Node.js Platform Developer',
  'Full Stack Engineer',
  'Data Infrastructure Engineer',
  'Frontend Specialist',
  'DevOps Architect',
  'Security Engineer',
  'Product Manager',
  'QA Automation Engineer',
];

const locations = [
  'Remote',
  'Ho Chi Minh City',
  'Hanoi',
  'Da Nang',
  'Singapore',
  'Tokyo',
  'London',
  'Berlin',
];
const jobTypes: JobType[] = [
  'full_time',
  'part_time',
  'contract',
  'internship',
];
const tagPool = [
  'nodejs',
  'mongodb',
  'redis',
  'typescript',
  'fastify',
  'database',
  'react',
  'nextjs',
  'docker',
  'kubernetes',
];
const appStatuses = [
  'submitted',
  'reviewing',
  'accepted',
  'rejected',
  'withdrawn',
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

async function seedData() {
  const db = await getDb();
  const jobsColl = db.collection<JobDoc>('jobs');
  const appsColl = db.collection<ApplicationDoc>('job_applications');

  console.log('Cleaning existing job data...');
  await jobsColl.deleteMany({});
  await appsColl.deleteMany({});

  console.log('Seeding 200 jobs...');
  const userIds = Array.from({ length: 20 }, () => new ObjectId());
  const jobs: JobDoc[] = [];

  for (let i = 1; i <= 200; i++) {
    let status: JobStatus = 'open';
    if (i > 100 && i <= 160) status = 'closed';
    else if (i > 160 && i <= 180) status = 'draft';
    else if (i > 180) status = 'archived';

    const title = `${pick(jobTitles)} ${i}`;
    const location = pick(locations);
    const createdAt = new Date();

    if (status === 'closed' || status === 'archived') {
      createdAt.setMonth(
        createdAt.getMonth() - (2 + Math.floor(Math.random() * 3)),
      );
    } else {
      createdAt.setDate(createdAt.getDate() - (i % 15));
    }

    jobs.push({
      _id: new ObjectId(),
      postedByUserId: pick(userIds),
      title,
      content: `This is a seeded job #${i}. Focus on high-performance ${pick(tagPool)} systems.`,
      status,
      jobType: pick(jobTypes),
      location,
      tags: [pick(tagPool), pick(tagPool)],
      applicationCount: 0,
      metadata: {
        companyInfo: {
          name: `TechCorp ${Math.ceil(i / 10)}`,
          industry: 'Software',
        },
        seniority: i % 3 === 0 ? 'senior' : 'mid',
        remote: location === 'Remote',
      },
      deletedAt: null,
      createdAt,
      updatedAt: new Date(),
    });
  }

  await jobsColl.insertMany(jobs);

  console.log('Seeding 500 applications...');
  const apps: any[] = [];
  for (let i = 1; i <= 500; i++) {
    const job = pick(jobs);
    const createdAt = new Date(job.createdAt);
    createdAt.setHours(createdAt.getHours() + Math.floor(Math.random() * 48));

    apps.push({
      _id: new ObjectId(),
      jobId: job._id,
      applicantUserId: new ObjectId(),
      status: pick(appStatuses),
      coverLetter: `I am very interested in the ${job.title} position. I have extensive experience with ${job.tags.join(', ')}.`,
      idempotencyKey: `seed-app-${i}`,
      metadata: { source: 'seed-script' },
      deletedAt: null,
      createdAt,
      updatedAt: new Date(),
    });
  }

  await appsColl.insertMany(apps);

  console.log('Updating application counts...');
  const counts = await appsColl
    .aggregate([{ $group: { _id: '$jobId', count: { $sum: 1 } } }])
    .toArray();

  for (const item of counts) {
    await jobsColl.updateOne(
      { _id: item._id },
      {
        $set: { applicationCount: new Int32(item.count) as unknown as number },
      },
    );
  }

  console.log('Seed completed successfully!');
}

try {
  await seedData();
} catch (error) {
  console.error('Error seeding data:', error);
} finally {
  await closeMongo();
}
