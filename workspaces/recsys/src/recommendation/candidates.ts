import type { Record as Neo4jRecord } from 'neo4j-driver';

import {
  getCachedTrending,
  getCachedUserSubscriptions,
  setCachedTrending,
  setCachedUserSubscriptions,
} from '../cache/feed-cache.js';
import {
  readTransaction,
  toNativeNumber,
  toNativeString,
  toNeo4jInteger,
  toOptionalNativeString,
} from '../neo4j/driver.js';
import type { Candidate, SuggestedSubstack } from './types.js';

const collaborativeCandidatesCypher = `
MATCH (me:User {id: $userId})-[:VOTED {type: 'up'}]->(:Topic)
      <-[:VOTED {type: 'up'}]-(peer:User)
      -[:VOTED {type: 'up'}]->(candidate:Topic)
WHERE candidate.createdAt > $cutoff
  AND NOT EXISTS { MATCH (me)-[:VOTED]->(candidate) }
RETURN candidate.id AS topicId,
       coalesce(candidate.createdAt, 0) AS createdAt,
       candidate.substackId AS substackId,
       coalesce(candidate.score, 0.0) AS popularity,
       count(DISTINCT peer) AS peerCount,
       false AS subscribed
ORDER BY peerCount DESC, popularity DESC
LIMIT $limit
`;

const substackCandidatesCypher = `
MATCH (me:User {id: $userId})-[:SUBSCRIBED]->(s:Substack)
      <-[:IN_SUBSTACK]-(candidate:Topic)
WHERE candidate.createdAt > $cutoff
  AND NOT EXISTS { MATCH (me)-[:VOTED]->(candidate) }
RETURN candidate.id AS topicId,
       coalesce(candidate.createdAt, 0) AS createdAt,
       candidate.substackId AS substackId,
       coalesce(candidate.score, 0.0) AS popularity,
       0 AS peerCount,
       true AS subscribed
ORDER BY candidate.createdAt DESC
LIMIT $limit
`;

const trendingCandidatesCypher = `
MATCH (candidate:Topic)
WHERE candidate.createdAt > $cutoff
RETURN candidate.id AS topicId,
       coalesce(candidate.createdAt, 0) AS createdAt,
       candidate.substackId AS substackId,
       coalesce(candidate.score, 0.0) AS popularity,
       0 AS peerCount,
       false AS subscribed
ORDER BY popularity DESC, candidate.createdAt DESC
LIMIT $limit
`;

const userSubscriptionsCypher = `
MATCH (:User {id: $userId})-[:SUBSCRIBED]->(s:Substack)
RETURN collect(s.id) AS ids
`;

const relatedByVotesCypher = `
MATCH (source:Topic {id: $topicId})<-[:VOTED {type: 'up'}]-(u:User)-[:VOTED {type: 'up'}]->(candidate:Topic)
WHERE candidate.id <> source.id
  AND candidate.createdAt > $cutoff
RETURN candidate.id AS topicId,
       coalesce(candidate.createdAt, 0) AS createdAt,
       candidate.substackId AS substackId,
       coalesce(candidate.score, 0.0) AS popularity,
       count(DISTINCT u) AS peerCount,
       false AS subscribed
ORDER BY peerCount DESC, popularity DESC
LIMIT $limit
`;

const relatedBySubstackCypher = `
MATCH (source:Topic {id: $topicId})
MATCH (candidate:Topic)
WHERE candidate.id <> source.id
  AND candidate.substackId = source.substackId
  AND candidate.createdAt > $cutoff
RETURN candidate.id AS topicId,
       coalesce(candidate.createdAt, 0) AS createdAt,
       candidate.substackId AS substackId,
       coalesce(candidate.score, 0.0) AS popularity,
       0 AS peerCount,
       false AS subscribed
ORDER BY popularity DESC, candidate.createdAt DESC
LIMIT $limit
`;

const suggestedSubstacksCypher = `
MATCH (me:User {id: $userId})-[:VOTED {type: 'up'}]->(:Topic)
      <-[:VOTED {type: 'up'}]-(peer:User)
      -[:SUBSCRIBED]->(s:Substack)
WHERE NOT EXISTS { MATCH (me)-[:SUBSCRIBED]->(s) }
RETURN s.id AS substackId,
       count(DISTINCT peer) AS score,
       'peer_subscription' AS reason
ORDER BY score DESC
LIMIT $limit
`;

export async function getCollaborativeCandidates(
  userId: string,
  cutoff: number,
  limit: number,
): Promise<Candidate[]> {
  return readTransaction(
    collaborativeCandidatesCypher,
    { userId, cutoff, limit: toNeo4jInteger(limit) },
    (record) => mapCandidate(record, 'collaborative'),
  );
}

export async function getSubstackCandidates(
  userId: string,
  cutoff: number,
  limit: number,
): Promise<Candidate[]> {
  return readTransaction(
    substackCandidatesCypher,
    { userId, cutoff, limit: toNeo4jInteger(limit) },
    (record) => mapCandidate(record, 'substack'),
  );
}

export async function getTrendingCandidates(
  cutoff: number,
  limit: number,
): Promise<Candidate[]> {
  const cached = await getCachedTrending<Candidate>();
  if (cached) return cached.slice(0, limit);

  const candidates = await readTransaction(
    trendingCandidatesCypher,
    { cutoff, limit: toNeo4jInteger(limit) },
    (record) => mapCandidate(record, 'trending'),
  );

  await setCachedTrending(candidates);
  return candidates;
}

export async function getUserSubscribedSubstackIds(
  userId: string,
): Promise<Set<string>> {
  const cached = await getCachedUserSubscriptions(userId);
  if (cached) return cached;

  const rows = await readTransaction(
    userSubscriptionsCypher,
    { userId },
    (record) => {
      const ids = record.get('ids') as unknown[];
      return ids.map(toNativeString);
    },
  );
  const ids = new Set(rows[0] ?? []);
  await setCachedUserSubscriptions(userId, ids);
  return ids;
}

export async function getRelatedTopicCandidates(
  topicId: string,
  cutoff: number,
  limit: number,
): Promise<Candidate[]> {
  const byVotes = await readTransaction(
    relatedByVotesCypher,
    { topicId, cutoff, limit: toNeo4jInteger(limit) },
    (record) => mapCandidate(record, 'similar'),
  );

  if (byVotes.length >= limit) return byVotes;

  const bySubstack = await readTransaction(
    relatedBySubstackCypher,
    { topicId, cutoff, limit: toNeo4jInteger(limit) },
    (record) => mapCandidate(record, 'similar'),
  );

  return dedupeCandidates([...byVotes, ...bySubstack]).slice(0, limit);
}

export async function getSuggestedSubstacks(
  userId: string,
  limit: number,
): Promise<SuggestedSubstack[]> {
  return readTransaction(
    suggestedSubstacksCypher,
    { userId, limit: toNeo4jInteger(limit) },
    (record) => ({
      substackId: toNativeString(record.get('substackId')),
      score: toNativeNumber(record.get('score')),
      reason: 'peer_subscription',
    }),
  );
}

export function dedupeCandidates(candidates: Candidate[]): Candidate[] {
  const byId = new Map<string, Candidate>();

  for (const candidate of candidates) {
    const current = byId.get(candidate.topicId);
    if (!current) {
      byId.set(candidate.topicId, candidate);
      continue;
    }

    byId.set(candidate.topicId, {
      ...current,
      peerCount: Math.max(current.peerCount, candidate.peerCount),
      popularity: Math.max(current.popularity, candidate.popularity),
      subscribed: current.subscribed || candidate.subscribed,
      source:
        current.source === 'collaborative' ? current.source : candidate.source,
    });
  }

  return [...byId.values()];
}

function mapCandidate(
  record: Neo4jRecord,
  source: Candidate['source'],
): Candidate {
  return {
    topicId: toNativeString(record.get('topicId')),
    createdAt: toNativeNumber(record.get('createdAt')),
    substackId: toOptionalNativeString(record.get('substackId')),
    popularity: toNativeNumber(record.get('popularity')),
    peerCount: toNativeNumber(record.get('peerCount')),
    source,
    subscribed: Boolean(record.get('subscribed')),
  };
}
