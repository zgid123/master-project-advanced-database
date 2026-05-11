import {
  invalidateTrending,
  invalidateUserFeed,
  invalidateUserSubscriptions,
} from '../cache/feed-cache.js';
import { writeTransaction } from '../neo4j/driver.js';
import { logger } from '../observability/logger.js';
import { eventIngested, ingestLagSeconds } from '../observability/metrics.js';
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
  ON CREATE SET s.createdAt = ev.createdAt,
                s.subscriberCount = coalesce(ev.subscriberCount, 0),
                s.subscriberCountAt = ev.subscriberCountAt
SET s.updatedAt = timestamp()
FOREACH (_ IN CASE
  WHEN ev.subscriberCount IS NOT NULL
    AND ev.subscriberCountAt > coalesce(s.subscriberCountAt, -1)
  THEN [1] ELSE [] END |
  SET s.subscriberCount = ev.subscriberCount,
      s.subscriberCountAt = ev.subscriberCountAt
)
SET s.subscriberCount = coalesce(s.subscriberCount, 0),
    s.subscriberCountAt = coalesce(s.subscriberCountAt, ev.subscriberCountAt)
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const deleteSubstackCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
OPTIONAL MATCH (s:Substack {id: ev.substackId})
DETACH DELETE s
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
    t.authorId = coalesce(ev.authorId, t.authorId),
    t.voteScore = coalesce(t.voteScore, ev.score, 0.0),
    t.hotness = coalesce(t.hotness, 0.0),
    t.updatedAt = timestamp()
MERGE (s:Substack {id: ev.substackId})
  ON CREATE SET s.createdAt = ev.createdAt
MERGE (t)-[inSubstack:IN_SUBSTACK]->(s)
  ON CREATE SET inSubstack.since = ev.createdAt
FOREACH (_ IN CASE WHEN ev.authorId IS NULL THEN [] ELSE [1] END |
  MERGE (author:User {id: ev.authorId})
    ON CREATE SET author.createdAt = ev.createdAt
  MERGE (author)-[authored:AUTHORED]->(t)
    ON CREATE SET authored.at = ev.createdAt
)
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
    t.authorId = coalesce(ev.authorId, t.authorId),
    t.voteScore = coalesce(t.voteScore, ev.score, 0.0),
    t.hotness = coalesce(t.hotness, 0.0),
    t.updatedAt = timestamp()
FOREACH (_ IN CASE WHEN ev.authorId IS NULL THEN [] ELSE [1] END |
  MERGE (author:User {id: ev.authorId})
    ON CREATE SET author.createdAt = ev.createdAt
  MERGE (author)-[authored:AUTHORED]->(t)
    ON CREATE SET authored.at = ev.createdAt
)
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const deleteTopicCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
OPTIONAL MATCH (t:Topic {id: ev.topicId})
DETACH DELETE t
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
    c.authorId = coalesce(ev.authorId, c.authorId),
    c.updatedAt = timestamp()
MERGE (t:Topic {id: ev.topicId})
  ON CREATE SET t.createdAt = ev.createdAt, t.voteScore = 0.0, t.hotness = 0.0
MERGE (c)-[:ON_TOPIC]->(t)
FOREACH (_ IN CASE WHEN ev.authorId IS NULL THEN [] ELSE [1] END |
  MERGE (author:User {id: ev.authorId})
    ON CREATE SET author.createdAt = ev.createdAt
  MERGE (author)-[authored:AUTHORED]->(c)
    ON CREATE SET authored.at = ev.createdAt
)
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const deleteCommentCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
OPTIONAL MATCH (c:Comment {id: ev.commentId})
DETACH DELETE c
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
SET u.lastActiveAt = ev.createdAt,
    u.lastSeenAt = ev.createdAt
MERGE (t:Topic {id: ev.targetId})
  ON CREATE SET t.createdAt = ev.createdAt, t.hotness = 0.0, t.voteScore = 0.0
FOREACH (_ IN CASE WHEN ev.substackId IS NULL THEN [] ELSE [1] END |
  SET t.substackId = coalesce(t.substackId, ev.substackId)
)
FOREACH (_ IN CASE WHEN ev.substackId IS NULL THEN [] ELSE [1] END |
  MERGE (s:Substack {id: ev.substackId})
    ON CREATE SET s.createdAt = ev.createdAt
  MERGE (t)-[inSubstack:IN_SUBSTACK]->(s)
    ON CREATE SET inSubstack.since = ev.createdAt
)
MERGE (u)-[r:VOTED]->(t)
  ON CREATE SET r.createdAt = ev.createdAt
WITH ev, pe, t, r, coalesce(r.weight, 0.0) AS oldWeight,
     CASE ev.voteType WHEN 'up' THEN 1.0 ELSE -1.0 END AS newWeight,
     CASE ev.voteType WHEN 'up' THEN 1 ELSE -1 END AS newVoteType
SET r.voteType = newVoteType,
    r.votedAt = ev.createdAt,
    r.weight = newWeight,
    t.voteScore = coalesce(t.voteScore, 0.0) - oldWeight + newWeight
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
SET u.lastActiveAt = ev.createdAt,
    u.lastSeenAt = ev.createdAt
MERGE (c:Comment {id: ev.targetId})
  ON CREATE SET c.createdAt = ev.createdAt
MERGE (u)-[r:VOTED]->(c)
  ON CREATE SET r.createdAt = ev.createdAt
WITH ev, pe, r,
     CASE ev.voteType WHEN 'up' THEN 1.0 ELSE -1.0 END AS newWeight,
     CASE ev.voteType WHEN 'up' THEN 1 ELSE -1 END AS newVoteType
SET r.voteType = newVoteType,
    r.votedAt = ev.createdAt,
    r.weight = newWeight
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const deleteTopicVoteCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
OPTIONAL MATCH (:User {id: ev.userId})-[r:VOTED]->(t:Topic {id: ev.targetId})
WITH ev, pe, r, t, coalesce(r.weight, 0.0) AS oldWeight
FOREACH (_ IN CASE WHEN t IS NULL THEN [] ELSE [1] END |
  SET t.voteScore = coalesce(t.voteScore, 0.0) - oldWeight
)
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
SET u.lastActiveAt = ev.createdAt,
    u.lastSeenAt = ev.createdAt
MERGE (s:Substack {id: ev.targetId})
  ON CREATE SET s.createdAt = ev.createdAt
MERGE (u)-[r:SUBSCRIBED]->(s)
  ON CREATE SET r.createdAt = ev.createdAt,
                r.since = ev.createdAt,
                r.countedEventId = ev.eventId
WITH ev, pe, s, r, r.countedEventId = ev.eventId AS created
FOREACH (_ IN CASE
  WHEN created AND ev.createdAt >= coalesce(s.subscriberCountAt, -1)
  THEN [1] ELSE [] END |
  SET s.subscriberCount = coalesce(s.subscriberCount, 0) + 1,
      s.subscriberCountAt = ev.createdAt
)
REMOVE r.countedEventId
SET r.createdAt = ev.createdAt,
    r.since = ev.createdAt
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
SET u.lastActiveAt = ev.createdAt,
    u.lastSeenAt = ev.createdAt
MERGE (t:Topic {id: ev.targetId})
  ON CREATE SET t.createdAt = ev.createdAt, t.hotness = 0.0, t.voteScore = 0.0
MERGE (u)-[r:SUBSCRIBED]->(t)
  ON CREATE SET r.createdAt = ev.createdAt,
                r.since = ev.createdAt
SET r.createdAt = ev.createdAt,
    r.since = ev.createdAt
SET pe.processedAt = timestamp()
RETURN count(pe) AS processed
`;

const deleteSubstackSubscriptionCypher = `
UNWIND $events AS ev
MERGE (pe:ProcessedEvent {id: ev.eventId})
  ON CREATE SET pe.firstSeenAt = timestamp(), pe.type = ev.type
WITH ev, pe
WHERE pe.processedAt IS NULL
OPTIONAL MATCH (:User {id: ev.userId})-[r:SUBSCRIBED]->(s:Substack {id: ev.targetId})
WITH ev, pe, r, s
FOREACH (_ IN CASE
  WHEN s IS NOT NULL AND ev.createdAt >= coalesce(s.subscriberCountAt, -1)
  THEN [1] ELSE [] END |
  SET s.subscriberCount = CASE
    WHEN coalesce(s.subscriberCount, 0) > 0 THEN s.subscriberCount - 1
    ELSE 0
  END,
      s.subscriberCountAt = ev.createdAt
)
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
  const sortedBatch = sortIngestBatch(batch);

  await ingestSubstacks(sortedBatch.substacks);
  await ingestTopics(sortedBatch.topics);
  await ingestComments(sortedBatch.comments);
  await ingestSubscriptions(sortedBatch.subscriptions);
  await ingestVotes(sortedBatch.votes);
  await invalidateAffectedCaches(sortedBatch);
}

async function ingestSubstacks(events: SubstackEvent[]): Promise<void> {
  await runIfPresent(
    upsertSubstackCypher,
    events.filter((event) => event.type === 'substack.upsert'),
    'substack',
  );
  await runIfPresent(
    deleteSubstackCypher,
    events.filter((event) => event.type === 'substack.deleted'),
    'substack',
  );
}

async function ingestTopics(events: TopicEvent[]): Promise<void> {
  const upserts = events.filter((event) => event.type === 'topic.upsert');
  const withSubstack = upserts.filter((event) => event.substackId != null);
  const withoutSubstack = upserts.filter((event) => event.substackId == null);

  await runIfPresent(upsertTopicWithSubstackCypher, withSubstack, 'topic');
  await runIfPresent(
    upsertTopicWithoutSubstackCypher,
    withoutSubstack,
    'topic',
  );
  await runIfPresent(
    deleteTopicCypher,
    events.filter((event) => event.type === 'topic.deleted'),
    'topic',
  );
}

async function ingestComments(events: CommentEvent[]): Promise<void> {
  await runIfPresent(
    upsertCommentCypher,
    events.filter((event) => event.type === 'comment.upsert'),
    'comment',
  );
  await runIfPresent(
    deleteCommentCypher,
    events.filter((event) => event.type === 'comment.deleted'),
    'comment',
  );
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
  recordIngestLag(events);
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

function recordIngestLag(events: unknown[]): void {
  const nowSeconds = Math.floor(Date.now() / 1_000);

  for (const event of events) {
    if (!event || typeof event !== 'object') continue;
    const createdAt = (event as { createdAt?: unknown }).createdAt;
    if (typeof createdAt !== 'number') continue;
    ingestLagSeconds.observe(Math.max(0, nowSeconds - createdAt));
  }
}

function sortIngestBatch(batch: IngestBatch): IngestBatch {
  return {
    substacks: [...batch.substacks].sort((left, right) =>
      left.substackId.localeCompare(right.substackId),
    ),
    topics: [...batch.topics].sort((left, right) =>
      left.topicId.localeCompare(right.topicId),
    ),
    comments: [...batch.comments].sort((left, right) =>
      compareKeys(commentSortKey(left), commentSortKey(right)),
    ),
    subscriptions: [...batch.subscriptions].sort((left, right) =>
      compareKeys(
        [left.userId, left.targetType, left.targetId],
        [right.userId, right.targetType, right.targetId],
      ),
    ),
    votes: [...batch.votes].sort((left, right) =>
      compareKeys(
        [left.userId, left.targetType, left.targetId],
        [right.userId, right.targetType, right.targetId],
      ),
    ),
  };
}

function commentSortKey(event: CommentEvent): string[] {
  return ['topicId' in event ? event.topicId : '', event.commentId];
}

function compareKeys(left: string[], right: string[]): number {
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const comparison = (left[index] ?? '').localeCompare(right[index] ?? '');
    if (comparison !== 0) return comparison;
  }

  return 0;
}
