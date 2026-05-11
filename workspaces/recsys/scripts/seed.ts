// biome-ignore-all lint/style/useNamingConvention: seed options are process.env keys.
import { z } from 'zod';

import { closeNeo4jDriver, writeTransaction } from '../src/neo4j/driver.js';
import { logger } from '../src/observability/logger.js';

const seedConfigSchema = z.object({
  SEED_USERS: z.coerce.number().int().positive().default(1_000),
  SEED_SUBSTACKS: z.coerce.number().int().positive().default(100),
  SEED_TOPICS: z.coerce.number().int().positive().default(5_000),
  SEED_VOTES: z.coerce.number().int().positive().default(20_000),
  SEED_SUBSCRIPTIONS: z.coerce.number().int().positive().default(5_000),
  SEED_BATCH_SIZE: z.coerce.number().int().positive().default(1_000),
});

const seedConfig = seedConfigSchema.parse(process.env);
const nowSeconds = Math.floor(Date.now() / 1_000);

try {
  await seedSubstacks();
  await seedUsers();
  await seedTopics();
  await seedSubscriptions();
  await seedVotes();
  logger.info(seedConfig, 'recsys seed completed');
} finally {
  await closeNeo4jDriver();
}

async function seedSubstacks(): Promise<void> {
  const substacks = range(seedConfig.SEED_SUBSTACKS).map((index) => ({
    id: `substack-${index + 1}`,
    createdAt: nowSeconds - randomInt(1, 90) * 86_400,
  }));

  await writeBatches(
    substacks,
    `
    UNWIND $items AS item
    MERGE (s:Substack {id: item.id})
      ON CREATE SET s.createdAt = item.createdAt
  `,
  );
}

async function seedUsers(): Promise<void> {
  const users = range(seedConfig.SEED_USERS).map((index) => ({
    id: `user-${index + 1}`,
    createdAt: nowSeconds - randomInt(1, 180) * 86_400,
    lastActiveAt: nowSeconds - randomInt(0, 14) * 86_400,
  }));

  await writeBatches(
    users,
    `
    UNWIND $items AS item
    MERGE (u:User {id: item.id})
      ON CREATE SET u.createdAt = item.createdAt
    SET u.lastActiveAt = item.lastActiveAt
  `,
  );
}

async function seedTopics(): Promise<void> {
  const topics = range(seedConfig.SEED_TOPICS).map((index) => {
    const substackId = `substack-${randomInt(1, seedConfig.SEED_SUBSTACKS)}`;

    return {
      id: `topic-${index + 1}`,
      substackId,
      createdAt: nowSeconds - randomInt(0, 30) * 86_400 - randomInt(0, 86_400),
      score: Math.random() * 10,
    };
  });

  await writeBatches(
    topics,
    `
    UNWIND $items AS item
    MERGE (t:Topic {id: item.id})
      ON CREATE SET t.createdAt = item.createdAt
    SET t.substackId = item.substackId,
        t.score = item.score
    MERGE (s:Substack {id: item.substackId})
    MERGE (t)-[:IN_SUBSTACK]->(s)
  `,
  );
}

async function seedSubscriptions(): Promise<void> {
  const subscriptions = range(seedConfig.SEED_SUBSCRIPTIONS).map(() => ({
    userId: `user-${randomInt(1, seedConfig.SEED_USERS)}`,
    substackId: `substack-${randomInt(1, seedConfig.SEED_SUBSTACKS)}`,
    createdAt: nowSeconds - randomInt(0, 30) * 86_400,
  }));

  await writeBatches(
    subscriptions,
    `
    UNWIND $items AS item
    MATCH (u:User {id: item.userId})
    MATCH (s:Substack {id: item.substackId})
    MERGE (u)-[r:SUBSCRIBED]->(s)
      ON CREATE SET r.createdAt = item.createdAt
  `,
  );
}

async function seedVotes(): Promise<void> {
  const votes = range(seedConfig.SEED_VOTES).map(() => {
    const voteType = Math.random() > 0.15 ? 'up' : 'down';

    return {
      userId: `user-${randomInt(1, seedConfig.SEED_USERS)}`,
      topicId: `topic-${randomInt(1, seedConfig.SEED_TOPICS)}`,
      voteType,
      createdAt: nowSeconds - randomInt(0, 30) * 86_400,
      weight: voteType === 'up' ? 1 : -1,
    };
  });

  await writeBatches(
    votes,
    `
    UNWIND $items AS item
    MATCH (u:User {id: item.userId})
    MATCH (t:Topic {id: item.topicId})
    MERGE (u)-[r:VOTED]->(t)
    SET r.type = item.voteType,
        r.createdAt = item.createdAt,
        r.weight = item.weight
  `,
  );
}

async function writeBatches<T>(items: T[], cypher: string): Promise<void> {
  for (
    let index = 0;
    index < items.length;
    index += seedConfig.SEED_BATCH_SIZE
  ) {
    await writeTransaction(cypher, {
      items: items.slice(index, index + seedConfig.SEED_BATCH_SIZE),
    });
  }
}

function range(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
