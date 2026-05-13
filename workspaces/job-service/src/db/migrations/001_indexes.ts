import type { Db, Document } from 'mongodb';

const validationOptions = {
  validationLevel: 'moderate',
  validationAction: 'error',
} as const;

const jobsValidator: Document = {
  $jsonSchema: {
    bsonType: 'object',
    title: 'Job validation',
    required: [
      '_id',
      'postedByUserId',
      'title',
      'content',
      'status',
      'applicationCount',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      _id: { bsonType: 'objectId' },
      postedByUserId: { bsonType: 'objectId' },
      title: { bsonType: 'string', minLength: 3, maxLength: 200 },
      content: { bsonType: 'string', maxLength: 20_000 },
      location: { bsonType: 'string', maxLength: 120 },
      jobType: { bsonType: 'string', enum: ['full_time', 'part_time', 'contract', 'internship'] },
      status: { bsonType: 'string', enum: ['draft', 'open', 'closed', 'archived'] },
      tags: {
        bsonType: 'array',
        maxItems: 16,
        items: { bsonType: 'string', maxLength: 32 },
      },
      applicationCount: { bsonType: 'int', minimum: 0 },
      metadata: { bsonType: 'object' },
      deletedAt: { bsonType: ['date', 'null'] },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
  },
};

const applicationsValidator: Document = {
  $jsonSchema: {
    bsonType: 'object',
    title: 'Job application validation',
    required: ['_id', 'jobId', 'applicantUserId', 'status', 'createdAt', 'updatedAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      jobId: { bsonType: 'objectId' },
      applicantUserId: { bsonType: 'objectId' },
      coverLetter: { bsonType: 'string', maxLength: 5_000 },
      resumeUrl: { bsonType: 'string', maxLength: 500 },
      status: { bsonType: 'string', enum: ['submitted', 'reviewing', 'accepted', 'rejected', 'withdrawn'] },
      idempotencyKey: { bsonType: 'string', maxLength: 80 },
      denormalized: {
        bsonType: 'object',
        properties: {
          jobTitle: { bsonType: 'string' },
          jobPostedByUserId: { bsonType: 'objectId' },
        },
      },
      metadata: { bsonType: 'object' },
      deletedAt: { bsonType: ['date', 'null'] },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
  },
};

const outboxValidator: Document = {
  $jsonSchema: {
    bsonType: 'object',
    title: 'Job outbox validation',
    required: ['_id', 'topic', 'payload', 'status', 'createdAt', 'attempts'],
    properties: {
      _id: { bsonType: 'objectId' },
      topic: { bsonType: 'string' },
      payload: { bsonType: 'object' },
      status: { bsonType: 'string', enum: ['pending', 'publishing', 'published', 'failed'] },
      publishedAt: { bsonType: ['date', 'null'] },
      lastError: { bsonType: 'string' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
      attempts: { bsonType: 'int', minimum: 0 },
    },
  },
};

async function ensureCollection(db: Db, name: string, validator: Document): Promise<void> {
  const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();

  if (exists) {
    await db.command({
      collMod: name,
      validator,
      ...validationOptions,
    });
    return;
  }

  await db.createCollection(name, {
    validator,
    ...validationOptions,
  });
}

async function dropIndexIfExists(db: Db, collectionName: string, indexName: string): Promise<void> {
  try {
    await db.collection(collectionName).dropIndex(indexName);
  } catch (error) {
    const maybeMongoError = error as { codeName?: string; code?: number };
    if (maybeMongoError.codeName !== 'IndexNotFound' && maybeMongoError.code !== 27) {
      throw error;
    }
  }
}

export async function up(db: Db): Promise<void> {
  await ensureCollection(db, 'jobs', jobsValidator);
  await ensureCollection(db, 'job_applications', applicationsValidator);
  await ensureCollection(db, 'job_outbox', outboxValidator);

  const idempotencyExists = await db
    .listCollections({ name: 'idempotency_keys' }, { nameOnly: true })
    .hasNext();
  if (!idempotencyExists) {
    await db.createCollection('idempotency_keys');
  }

  await dropIndexIfExists(db, 'job_applications', 'idx_apps_jobId');
  await dropIndexIfExists(db, 'job_applications', 'idx_apps_applicant');
  await dropIndexIfExists(db, 'job_outbox', 'idx_outbox_pending');

  await db.collection('jobs').createIndexes([
    { key: { postedByUserId: 1 }, name: 'idx_jobs_postedBy' },
    {
      key: { createdAt: -1, _id: -1 },
      name: 'idx_jobs_open_listing',
      partialFilterExpression: { status: 'open', deletedAt: null },
    },
    {
      key: { title: 'text', content: 'text', location: 'text' },
      name: 'idx_jobs_text',
      weights: { title: 10, location: 5, content: 1 },
      default_language: 'english',
    },
    { key: { tags: 1, createdAt: -1 }, name: 'idx_jobs_tags_recency' },
    { key: { 'metadata.$**': 1 }, name: 'idx_jobs_metadata_wildcard' },
  ]);

  await db.collection('job_applications').createIndexes([
    { key: { jobId: 1, status: 1, createdAt: -1, _id: -1 }, name: 'idx_apps_job_status_recency' },
    { key: { applicantUserId: 1, createdAt: -1, _id: -1 }, name: 'idx_apps_user_recency' },
    {
      key: { applicantUserId: 1, jobId: 1, status: 1 },
      name: 'idx_apps_user_job_status',
      partialFilterExpression: { deletedAt: null },
    },
    {
      key: { applicantUserId: 1, idempotencyKey: 1 },
      name: 'uniq_apps_idempotency',
      unique: true,
      partialFilterExpression: { idempotencyKey: { $exists: true } },
    },
    {
      key: { deletedAt: 1 },
      name: 'ttl_withdrawn_180d',
      expireAfterSeconds: 60 * 60 * 24 * 180,
      partialFilterExpression: { status: 'withdrawn' },
    },
  ]);

  await db.collection('job_outbox').createIndexes([
    {
      key: { status: 1, createdAt: 1, _id: 1 },
      name: 'idx_outbox_claim_pending',
      partialFilterExpression: { status: 'pending' },
    },
    {
      key: { status: 1, updatedAt: 1, createdAt: 1, _id: 1 },
      name: 'idx_outbox_claim_publishing',
      partialFilterExpression: { status: 'publishing' },
    },
    {
      key: { status: 1, updatedAt: 1, createdAt: 1, _id: 1 },
      name: 'idx_outbox_claim_failed',
      partialFilterExpression: { status: 'failed' },
    },
  ]);

  await db.collection('idempotency_keys').createIndex(
    { createdAt: 1 },
    { name: 'ttl_idempotency_keys_24h', expireAfterSeconds: 86_400 },
  );
}

export async function down(db: Db): Promise<void> {
  for (const collectionName of ['jobs', 'job_applications', 'job_outbox', 'idempotency_keys']) {
    const exists = await db.listCollections({ name: collectionName }, { nameOnly: true }).hasNext();
    if (!exists) continue;

    const indexes = await db.collection(collectionName).indexes();
    for (const index of indexes) {
      if (index.name && index.name !== '_id_') {
        await db.collection(collectionName).dropIndex(index.name);
      }
    }
  }
}
