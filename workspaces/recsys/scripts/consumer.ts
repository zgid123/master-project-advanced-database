import { closeRedis } from '../src/cache/redis.js';
import { runConsumerLoop } from '../src/events/stream.js';
import { closeNeo4jDriver } from '../src/neo4j/driver.js';

try {
  await runConsumerLoop();
} finally {
  await Promise.all([closeNeo4jDriver(), closeRedis()]);
}
