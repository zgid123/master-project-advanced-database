import { closeRedis } from '../src/cache/redis.js';
import {
  closeBatchQueue,
  createBatchWorker,
  registerRepeatableJobs,
} from '../src/jobs/queue.js';
import { closeNeo4jDriver } from '../src/neo4j/driver.js';
import { logger } from '../src/observability/logger.js';

const worker = createBatchWorker();
await registerRepeatableJobs();

logger.info('recsys batch worker started');

await new Promise<void>((resolve) => {
  const shutdown = async () => {
    logger.info('stopping recsys batch worker');
    await worker.close();
    await Promise.all([closeBatchQueue(), closeNeo4jDriver(), closeRedis()]);
    resolve();
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
});
