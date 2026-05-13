import { ObjectId, type Collection } from 'mongodb';
import { getRedis } from '../cache/redis.js';
import { closeMongo, getDb } from '../db/mongo.js';
import { logger } from '../observability/logger.js';

type OutboxDoc = {
  _id: ObjectId;
  topic: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  publishedAt: Date | null;
  lastError?: string;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
};

type PublishOneResult = 'published' | 'empty' | 'failed';
const stalePublishingMs = 60_000;
const failedRetryMs = 30_000;
let shuttingDown = false;

async function outboxCollection(): Promise<Collection<OutboxDoc>> {
  return (await getDb()).collection<OutboxDoc>('job_outbox');
}

async function publishOne(redis: Awaited<ReturnType<typeof getRedis>>): Promise<PublishOneResult> {
  const outbox = await outboxCollection();
  const now = new Date();
  const stalePublishingBefore = new Date(now.getTime() - stalePublishingMs);
  const retryFailedBefore = new Date(now.getTime() - failedRetryMs);
  const row = await outbox.findOneAndUpdate(
    {
      $or: [
        { status: 'pending' },
        { status: 'publishing', updatedAt: { $lt: stalePublishingBefore } },
        { status: 'failed', updatedAt: { $lt: retryFailedBefore } },
      ],
    },
    {
      $set: {
        status: 'publishing',
        publishedAt: null,
        updatedAt: now,
      },
      $unset: { lastError: '' },
      $inc: { attempts: 1 },
    },
    {
      sort: { createdAt: 1, _id: 1 },
      returnDocument: 'after',
    },
  );

  if (!row) return 'empty';

  try {
    await redis.xadd(
      'jobs.events',
      'MAXLEN',
      '~',
      '100000',
      '*',
      'type',
      row.topic,
      'id',
      row._id.toHexString(),
      'payload',
      JSON.stringify(row.payload),
      'ts',
      Date.now().toString(),
    );
    await outbox.updateOne(
      { _id: row._id },
      {
        $set: {
          status: 'published',
          publishedAt: new Date(),
          updatedAt: new Date(),
        },
        $unset: { lastError: '' },
      },
    );
    return 'published';
  } catch (error) {
    await outbox.updateOne(
      { _id: row._id },
      {
        $set: {
          status: 'failed',
          lastError: error instanceof Error ? error.message : String(error),
          updatedAt: new Date(),
        },
      },
    );
    return 'failed';
  }
}

async function publishBatch(limit = 100): Promise<number> {
  const redis = await getRedis();
  let published = 0;

  for (let index = 0; index < limit; index += 1) {
    const result = await publishOne(redis);

    if (result === 'published') {
      published += 1;
      continue;
    }

    break;
  }

  return published;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('starting MongoDB outbox publisher');

  while (!shuttingDown) {
    const count = await publishBatch().catch((error: unknown) => {
      logger.error({ error }, 'outbox publish failed');
      return 0;
    });

    if (count === 0 && !shuttingDown) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }

  await closeMongo();
}

export { publishBatch };

process.on('SIGTERM', async () => {
  shuttingDown = true;
});

process.on('SIGINT', async () => {
  shuttingDown = true;
});
