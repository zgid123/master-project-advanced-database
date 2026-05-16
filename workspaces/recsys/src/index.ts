import 'dotenv/config';
import { buildApp } from './app.js';
import { config } from './config.js';
import { runConsumerLoop } from './events/stream.js';

const app = await buildApp();

await app.listen({
  host: config.host,
  port: config.port,
});

// Start the consumer loop in the background to process events from Redis into Neo4j
runConsumerLoop().catch((error) => {
  app.log.error({ error }, 'event consumer loop failed');
});
