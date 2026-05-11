import neo4j, {
  type Driver,
  type Integer,
  type Record as Neo4jRecord,
  type QueryResult,
} from 'neo4j-driver';

import { config } from '../config.js';
import { logger } from '../observability/logger.js';

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
  if (driver) return driver;

  driver = neo4j.driver(
    config.neo4jUri,
    neo4j.auth.basic(config.neo4jUser, config.neo4jPassword),
    {
      maxConnectionPoolSize: config.neo4jPoolSize,
      connectionAcquisitionTimeout: config.neo4jConnectionAcquisitionTimeoutMs,
      maxTransactionRetryTime: config.neo4jMaxTransactionRetryTimeMs,
    },
  );

  return driver;
}

export async function verifyNeo4jConnectivity(): Promise<void> {
  await getNeo4jDriver().verifyConnectivity();
}

export async function closeNeo4jDriver(): Promise<void> {
  if (!driver) return;
  await driver.close();
  driver = null;
}

export async function readTransaction<T>(
  cypher: string,
  params: Record<string, unknown>,
  mapRecord: (record: Neo4jRecord) => T,
): Promise<T[]> {
  const session = getNeo4jDriver().session({
    database: config.neo4jDatabase,
    defaultAccessMode: neo4j.session.READ,
  });

  try {
    const result = await session.executeRead((tx) => tx.run(cypher, params));
    return result.records.map(mapRecord);
  } finally {
    await session.close();
  }
}

export async function writeTransaction(
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<QueryResult> {
  const session = getNeo4jDriver().session({
    database: config.neo4jDatabase,
    defaultAccessMode: neo4j.session.WRITE,
  });

  try {
    return await session.executeWrite((tx) => tx.run(cypher, params));
  } finally {
    await session.close();
  }
}

export function toNativeNumber(value: unknown): number {
  if (neo4j.isInt(value)) return (value as Integer).toNumber();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
}

export function toNeo4jInteger(value: number): Integer {
  return neo4j.int(value);
}

export function toNativeString(value: unknown): string {
  if (neo4j.isInt(value)) return (value as Integer).toString();
  return String(value ?? '');
}

export function toOptionalNativeString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return toNativeString(value);
}

process.on('beforeExit', () => {
  closeNeo4jDriver().catch((error: unknown) => {
    logger.warn({ error }, 'failed to close neo4j driver');
  });
});
