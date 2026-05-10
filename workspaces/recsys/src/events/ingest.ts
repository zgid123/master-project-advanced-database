import {
  invalidateTrending,
  invalidateUserFeed,
  invalidateUserSubscriptions,
} from '../cache/feed-cache.js';
import { writeTransaction } from '../neo4j/driver.js';
import { logger } from '../observability/logger.js';
import { eventIngested } from '../observability/metrics.js';
import type {
  CommentEvent,
  IngestBatch,
  SubscriptionEvent,
  SubstackEvent,
  TopicEvent,
  VoteEvent,
} from './types.js';

const upsertSubstackCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
MERGE (s:Substack {id: ev.substackId})
  ON CREATE SET s.createdAt = ev.createdAt
SET s.updatedAt = timestamp()
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const upsertTopicWithSubstackCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
MERGE (t:Topic {id: ev.topicId})
  ON CREATE SET t.createdAt = ev.createdAt
SET t.createdAt = coalesce(t.createdAt, ev.createdAt),
    t.substackId = ev.substackId,
    t.score = coalesce(ev.score, t.score, 0.0),
    t.updatedAt = timestamp()
MERGE (s:Substack {id: ev.substackId})
  ON CREATE SET s.createdAt = ev.createdAt
MERGE (t)-[:IN_SUBSTACK]->(s)
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const upsertTopicWithoutSubstackCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
MERGE (t:Topic {id: ev.topicId})
  ON CREATE SET t.createdAt = ev.createdAt
SET t.createdAt = coalesce(t.createdAt, ev.createdAt),
    t.score = coalesce(ev.score, t.score, 0.0),
    t.updatedAt = timestamp()
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const upsertCommentCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
MERGE (c:Comment {id: ev.commentId})
  ON CREATE SET c.createdAt = ev.createdAt
SET c.topicId = ev.topicId,
    c.updatedAt = timestamp()
MERGE (t:Topic {id: ev.topicId})
  ON CREATE SET t.createdAt = ev.createdAt, t.score = 0.0
MERGE (c)-[:ON_TOPIC]->(t)
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const upsertTopicVoteCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
MERGE (u:User {id: ev.userId})
  ON CREATE SET u.createdAt = ev.createdAt
SET u.lastActiveAt = ev.createdAt
MERGE (t:Topic {id: ev.targetId})
  ON CREATE SET t.createdAt = ev.createdAt, t.score = 0.0
MERGE (u)-[r:VOTED]->(t)
  ON CREATE SET r.createdAt = ev.createdAt
SET r.type = ev.voteType,
    r.createdAt = ev.createdAt,
    r.weight = CASE ev.voteType WHEN 'up' THEN 1.0 ELSE -1.0 END
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const upsertCommentVoteCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
MERGE (u:User {id: ev.userId})
  ON CREATE SET u.createdAt = ev.createdAt
SET u.lastActiveAt = ev.createdAt
MERGE (c:Comment {id: ev.targetId})
  ON CREATE SET c.createdAt = ev.createdAt
MERGE (u)-[r:VOTED]->(c)
  ON CREATE SET r.createdAt = ev.createdAt
SET r.type = ev.voteType,
    r.createdAt = ev.createdAt,
    r.weight = CASE ev.voteType WHEN 'up' THEN 1.0 ELSE -1.0 END
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const deleteTopicVoteCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
OPTIONAL MATCH (:User {id: ev.userId})-[r:VOTED]->(:Topic {id: ev.targetId})
DELETE r
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const deleteCommentVoteCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
OPTIONAL MATCH (:User {id: ev.userId})-[r:VOTED]->(:Comment {id: ev.targetId})
DELETE r
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const upsertSubstackSubscriptionCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
MERGE (u:User {id: ev.userId})
  ON CREATE SET u.createdAt = ev.createdAt
SET u.lastActiveAt = ev.createdAt
MERGE (s:Substack {id: ev.targetId})
  ON CREATE SET s.createdAt = ev.createdAt
MERGE (u)-[r:SUBSCRIBED]->(s)
  ON CREATE SET r.createdAt = ev.createdAt
SET r.createdAt = ev.createdAt
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const upsertTopicSubscriptionCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
MERGE (u:User {id: ev.userId})
  ON CREATE SET u.createdAt = ev.createdAt
SET u.lastActiveAt = ev.createdAt
MERGE (t:Topic {id: ev.targetId})
  ON CREATE SET t.createdAt = ev.createdAt, t.score = 0.0
MERGE (u)-[r:SUBSCRIBED]->(t)
  ON CREATE SET r.createdAt = ev.createdAt
SET r.createdAt = ev.createdAt
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const deleteSubstackSubscriptionCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
OPTIONAL MATCH (:User {id: ev.userId})-[r:SUBSCRIBED]->(:Substack {id: ev.targetId})
DELETE r
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const deleteTopicSubscriptionCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
OPTIONAL MATCH (:User {id: ev.userId})-[r:SUBSCRIBED]->(:Topic {id: ev.targetId})
DELETE r
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

export async function ingestBatch(batch: IngestBatch): Promise<void> {
  await ingestSubstacks(batch.substacks);
  await ingestTopics(batch.topics);
  await ingestComments(batch.comments);
  await ingestSubscriptions(batch.subscriptions);
  await ingestVotes(batch.votes);
  await invalidateAffectedCaches(batch);
}

async function ingestSubstacks(events: SubstackEvent[]): Promise<void> {
  await runIfPresent(upsertSubstackCypher, events, 'substack');
}

async function ingestTopics(events: TopicEvent[]): Promise<void> {
  const withSubstack = events.filter((event) => event.substackId != null);
  const withoutSubstack = events.filter((event) => event.substackId == null);

  await runIfPresent(upsertTopicWithSubstackCypher, withSubstack, 'topic');
  await runIfPresent(
    upsertTopicWithoutSubstackCypher,
    withoutSubstack,
    'topic',
  );
}

async function ingestComments(events: CommentEvent[]): Promise<void> {
  await runIfPresent(upsertCommentCypher, events, 'comment');
}

async function ingestVotes(events: VoteEvent[]): Promise<void> {
  const created = events.filter((event) => event.type === 'vote.created');
  const deleted = events.filter((event) => event.type === 'vote.deleted');

  await runIfPresent(
    upsertTopicVoteCypher,
    created.filter((event) => event.targetType === 'topic'),
    'vote',
  );
  await runIfPresent(
    upsertCommentVoteCypher,
    created.filter((event) => event.targetType === 'comment'),
    'vote',
  );
  await runIfPresent(
    deleteTopicVoteCypher,
    deleted.filter((event) => event.targetType === 'topic'),
    'vote',
  );
  await runIfPresent(
    deleteCommentVoteCypher,
    deleted.filter((event) => event.targetType === 'comment'),
    'vote',
  );
}

async function ingestSubscriptions(events: SubscriptionEvent[]): Promise<void> {
  const created = events.filter(
    (event) => event.type === 'subscription.created',
  );
  const deleted = events.filter(
    (event) => event.type === 'subscription.deleted',
  );

  await runIfPresent(
    upsertSubstackSubscriptionCypher,
    created.filter((event) => event.targetType === 'substack'),
    'subscription',
  );
  await runIfPresent(
    upsertTopicSubscriptionCypher,
    created.filter((event) => event.targetType === 'topic'),
    'subscription',
  );
  await runIfPresent(
    deleteSubstackSubscriptionCypher,
    deleted.filter((event) => event.targetType === 'substack'),
    'subscription',
  );
  await runIfPresent(
    deleteTopicSubscriptionCypher,
    deleted.filter((event) => event.targetType === 'topic'),
    'subscription',
  );
}

async function runIfPresent(
  cypher: string,
  events: unknown[],
  metricKind: string,
): Promise<void> {
  if (events.length === 0) return;
  await writeTransaction(cypher, { events });
  eventIngested.inc({ kind: metricKind }, events.length);
}

async function invalidateAffectedCaches(batch: IngestBatch): Promise<void> {
  const affectedUserIds = new Set<string>();
  const affectedSubscriptionUserIds = new Set<string>();
  let trendingMayHaveChanged = batch.topics.length > 0;

  for (const event of batch.votes) {
    affectedUserIds.add(event.userId);
    if (event.targetType === 'topic') trendingMayHaveChanged = true;
  }

  for (const event of batch.subscriptions) {
    affectedUserIds.add(event.userId);
    affectedSubscriptionUserIds.add(event.userId);
  }

  try {
    await Promise.all([
      ...[...affectedUserIds].map((userId) => invalidateUserFeed(userId)),
      ...[...affectedSubscriptionUserIds].map((userId) =>
        invalidateUserSubscriptions(userId),
      ),
      trendingMayHaveChanged ? invalidateTrending() : Promise.resolve(),
    ]);
  } catch (error) {
    logger.warn({ error }, 'cache invalidation failed after event ingestion');
  }
}
