import { type Job, Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

import { config } from '../config.js';
import { logger } from '../observability/logger.js';
import {
  pruneProcessedEvents,
  refreshPopularityScores,
  refreshUserSimilarity,
} from './batch.js';

let queue: Queue | null = null;
let workerConnection: Redis | null = null;

function getBullConnection(): Redis {
  if (workerConnection) return workerConnection;

  workerConnection = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  });

  return workerConnection;
}

export function getBatchQueue(): Queue {
  if (queue) return queue;

  queue = new Queue(config.jobs.queueName, {
    connection: getBullConnection(),
  });

  return queue;
}

export async function registerRepeatableJobs(): Promise<void> {
  const batchQueue = getBatchQueue();

  await batchQueue.add(
    'refresh-popularity',
    {},
    {
      jobId: 'refresh-popularity-schedule',
      repeat: {
        pattern: config.jobs.popularityRefreshCron,
      },
      removeOnComplete: 20,
      removeOnFail: 50,
    },
  );

  await batchQueue.add(
    'refresh-similarity',
    {},
    {
      jobId: 'refresh-similarity-schedule',
      repeat: {
        pattern: config.jobs.similarityRefreshCron,
      },
      removeOnComplete: 20,
      removeOnFail: 50,
    },
  );

  await batchQueue.add(
    'prune-processed-events',
    {},
    {
      jobId: 'prune-processed-events-schedule',
      repeat: {
        pattern: config.jobs.processedEventPruneCron,
      },
      removeOnComplete: 20,
      removeOnFail: 50,
    },
  );
}

export function createBatchWorker(): Worker {
  return new Worker(
    config.jobs.queueName,
    async (job: Job) => {
      switch (job.name) {
        case 'refresh-popularity':
          return refreshPopularityScores();
        case 'refresh-similarity':
          return refreshUserSimilarity();
        case 'prune-processed-events':
          return pruneProcessedEvents();
        default:
          throw new Error(`Unsupported batch job: ${job.name}`);
      }
    },
    {
      connection: getBullConnection(),
      concurrency: 1,
    },
  )
    .on('completed', (job, result) => {
      logger.info(
        { jobId: job.id, name: job.name, result },
        'recsys batch job completed',
      );
    })
    .on('failed', (job, error) => {
      logger.error(
        { jobId: job?.id, name: job?.name, error },
        'recsys batch job failed',
      );
    });
}

export async function closeBatchQueue(): Promise<void> {
  await queue?.close();
  queue = null;

  if (workerConnection) {
    workerConnection.disconnect();
    workerConnection = null;
  }
}
