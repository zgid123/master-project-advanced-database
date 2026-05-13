import { MongoClient, type ClientSession, type Db } from 'mongodb';
import { config } from '../config.js';
import { logger } from '../observability/logger.js';

let client: MongoClient | null = null;
let connectionAttempt: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client;
  if (connectionAttempt) return connectionAttempt;

  connectionAttempt = MongoClient.connect(config.mongodbUri, {
    appName: 'job-service',
    maxPoolSize: config.mongodbMaxPoolSize,
    minPoolSize: config.mongodbMinPoolSize,
    maxIdleTimeMS: config.mongodbMaxIdleTimeMs,
    maxConnecting: config.mongodbMaxConnecting,
    waitQueueTimeoutMS: config.mongodbWaitQueueTimeoutMs,
    writeConcern: { w: 'majority', j: true },
    retryWrites: true,
  })
    .then((connected) => {
      client = connected;
      client.on('error', (error) => {
        logger.error({ error }, 'mongodb client error');
      });
      return connected;
    })
    .finally(() => {
      connectionAttempt = null;
    });

  return connectionAttempt;
}

export async function getDb(): Promise<Db> {
  const mongo = await getMongoClient();
  return mongo.db(config.mongodbDbName);
}

export async function withMongoTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const mongo = await getMongoClient();
  const session = mongo.startSession({ causalConsistency: true });

  try {
    return await session.withTransaction(fn, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority', j: true },
      readPreference: 'primary',
    });
  } finally {
    await session.endSession();
  }
}

export async function closeMongo(): Promise<void> {
  if (!client) return;

  await client.close();
  client = null;
}
