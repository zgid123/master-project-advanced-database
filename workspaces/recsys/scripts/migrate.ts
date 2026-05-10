import {
  closeNeo4jDriver,
  verifyNeo4jConnectivity,
} from '../src/neo4j/driver.js';
import { runMigrations } from '../src/neo4j/migrations.js';
import { logger } from '../src/observability/logger.js';

try {
  await verifyNeo4jConnectivity();
  await runMigrations();
  logger.info('recsys neo4j migrations completed');
} finally {
  await closeNeo4jDriver();
}
