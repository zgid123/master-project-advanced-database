// biome-ignore-all lint/style/useNamingConvention: stream tuple aliases use domain names.
import type { Redis } from 'ioredis';

import { getRedis } from '../cache/redis.js';
import { config } from '../config.js';
import { logger } from '../observability/logger.js';
import { ingestBatchSize } from '../observability/metrics.js';
import { ingestBatch } from './ingest.js';
import {
  commentEventSchema,
  type EventKind,
  emptyIngestBatch,
  type IngestBatch,
  normalizeEventInput,
  type RecSysEvent,
  subscriptionEventSchema,
  substackEventSchema,
  topicEventSchema,
  voteEventSchema,
} from './types.js';

type RedisStreamEntry = [id: string, fields: string[]];
type RedisStreamReadResponse = Array<
  [stream: string, entries: RedisStreamEntry[]]
>;

const streamByKind: Record<EventKind, string> = {
  vote: config.events.streams.vote,
  subscription: config.events.streams.subscription,
  topic: config.events.streams.topic,
  comment: config.events.streams.comment,
  substack: config.events.streams.substack,
};

const kindByStream = new Map<string, EventKind>(
  Object.entries(streamByKind).map(([kind, stream]) => [
    stream,
    kind as EventKind,
  ]),
);

export async function appendEventsToStream(
  kind: EventKind,
  events: RecSysEvent[],
): Promise<number> {
  if (events.length === 0) return 0;

  const redis = await getRedis();
  const stream = streamByKind[kind];
  const pipeline = redis.pipeline();

  for (const event of events) {
    pipeline.xadd(
      stream,
      'MAXLEN',
      '~',
      '1000000',
      '*',
      'type',
      event.type,
      'eventId',
      event.eventId,
      'payload',
      JSON.stringify(event),
    );
  }

  await pipeline.exec();
  return events.length;
}

export async function ensureConsumerGroups(redis: Redis): Promise<void> {
  await Promise.all(
    Object.values(streamByKind).map(async (stream) => {
      try {
        await redis.xgroup(
          'CREATE',
          stream,
          config.events.consumerGroup,
          '$',
          'MKSTREAM',
        );
      } catch (error) {
        if (error instanceof Error && error.message.includes('BUSYGROUP'))
          return;
        throw error;
      }
    }),
  );
}

export async function readAndIngestOnce(redis: Redis): Promise<number> {
  const claimed = await claimAndIngest(redis);
  if (claimed > 0) return claimed;

  const streams = Object.values(streamByKind);
  const response = (await redis.xreadgroup(
    'GROUP',
    config.events.consumerGroup,
    config.events.consumerName,
    'COUNT',
    config.events.batchSize,
    'BLOCK',
    config.events.blockMs,
    'STREAMS',
    ...streams,
    ...streams.map(() => '>'),
  )) as RedisStreamReadResponse | null;

  if (!response) return 0;

  const batch = emptyIngestBatch();
  const ackByStream = new Map<string, string[]>();
  let seen = 0;

  for (const [stream, entries] of response) {
    for (const [id, fields] of entries) {
      seen += 1;
      pushAck(ackByStream, stream, id);

      try {
        pushEvent(batch, parseStreamEvent(stream, fields));
      } catch (error) {
        logger.warn({ error, stream, id }, 'dropping invalid recsys event');
      }
    }
  }

  await ingestBatch(batch);
  await ackStreams(redis, ackByStream);
  ingestBatchSize.observe(seen);
  return seen;
}

async function claimAndIngest(redis: Redis): Promise<number> {
  const ackByStream = new Map<string, string[]>();
  const batch = emptyIngestBatch();
  let seen = 0;

  for (const stream of Object.values(streamByKind)) {
    const response = (await redis.xautoclaim(
      stream,
      config.events.consumerGroup,
      config.events.consumerName,
      config.events.claimIdleMs,
      '0-0',
      'COUNT',
      50,
    )) as [string, RedisStreamEntry[], string[]?];
    const entries = response[1] ?? [];

    for (const [id, fields] of entries) {
      seen += 1;
      pushAck(ackByStream, stream, id);

      try {
        pushEvent(batch, parseStreamEvent(stream, fields));
      } catch (error) {
        logger.warn(
          { error, stream, id },
          'dropping invalid claimed recsys event',
        );
      }
    }
  }

  if (seen === 0) return 0;

  await ingestBatch(batch);
  await ackStreams(redis, ackByStream);
  ingestBatchSize.observe(seen);
  return seen;
}

export async function runConsumerLoop(): Promise<void> {
  const redis = await getRedis();
  await ensureConsumerGroups(redis);

  logger.info(
    {
      group: config.events.consumerGroup,
      consumer: config.events.consumerName,
    },
    'starting recsys event consumer',
  );

  let shuttingDown = false;
  const shutdown = () => {
    shuttingDown = true;
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  while (!shuttingDown) {
    try {
      const count = await readAndIngestOnce(redis);
      if (count === 0) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } catch (error) {
      logger.error({ error }, 'event consumer batch failed');
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

function parseStreamEvent(stream: string, fields: string[]): RecSysEvent {
  const kind = kindByStream.get(stream);
  if (!kind) {
    throw new Error(`Unknown stream: ${stream}`);
  }

  const fieldMap = fieldsToObject(fields);
  const payload = fieldMap.payload
    ? (JSON.parse(fieldMap.payload) as Record<string, unknown>)
    : { ...fieldMap };

  if (!payload.type) {
    payload.type = inferEventType(kind, payload);
  }

  const normalized = normalizeEventInput(payload);

  switch (kind) {
    case 'vote':
      return voteEventSchema.parse(normalized);
    case 'subscription':
      return subscriptionEventSchema.parse(normalized);
    case 'topic':
      return topicEventSchema.parse(normalized);
    case 'comment':
      return commentEventSchema.parse(normalized);
    case 'substack':
      return substackEventSchema.parse(normalized);
  }
}

function inferEventType(
  kind: EventKind,
  payload: Record<string, unknown>,
): string {
  if (kind === 'vote')
    return payload.voteType ? 'vote.created' : 'vote.deleted';
  if (kind === 'subscription')
    return payload.createdAt ? 'subscription.created' : 'subscription.deleted';
  if (kind === 'topic') return 'topic.upsert';
  if (kind === 'comment') return 'comment.upsert';
  return 'substack.upsert';
}

function pushEvent(batch: IngestBatch, event: RecSysEvent): void {
  switch (event.type) {
    case 'vote.created':
    case 'vote.deleted':
      batch.votes.push(event);
      return;
    case 'subscription.created':
    case 'subscription.deleted':
      batch.subscriptions.push(event);
      return;
    case 'topic.upsert':
    case 'topic.deleted':
      batch.topics.push(event);
      return;
    case 'comment.upsert':
    case 'comment.deleted':
      batch.comments.push(event);
      return;
    case 'substack.upsert':
    case 'substack.deleted':
      batch.substacks.push(event);
      return;
  }
}

function fieldsToObject(fields: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (let index = 0; index < fields.length; index += 2) {
    const key = fields[index];
    const value = fields[index + 1];
    if (key && value !== undefined) result[key] = value;
  }

  return result;
}

function pushAck(
  ackByStream: Map<string, string[]>,
  stream: string,
  id: string,
): void {
  const current = ackByStream.get(stream) ?? [];
  current.push(id);
  ackByStream.set(stream, current);
}

async function ackStreams(
  redis: Redis,
  ackByStream: Map<string, string[]>,
): Promise<void> {
  const pipeline = redis.pipeline();

  for (const [stream, ids] of ackByStream.entries()) {
    if (ids.length > 0) {
      pipeline.xack(stream, config.events.consumerGroup, ...ids);
    }
  }

  await pipeline.exec();
}
