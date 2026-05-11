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
MATCH (me:User {id: $userId})-[myVote:VOTED]->(seed:Topic)
WHERE coalesce(myVote.voteType, CASE myVote.type WHEN 'up' THEN 1 ELSE -1 END) = 1
  AND coalesce(myVote.votedAt, myVote.createdAt, 0) > $cutoff
WITH me, collect(DISTINCT seed) AS myTopics
WITH me, myTopics WHERE size(myTopics) >= $minVotes
UNWIND myTopics AS seed
MATCH (seed)<-[peerVote:VOTED]-(peer:User)
WHERE peer.id <> $userId
  AND coalesce(peerVote.voteType, CASE peerVote.type WHEN 'up' THEN 1 ELSE -1 END) = 1
  AND coalesce(peerVote.votedAt, peerVote.createdAt, 0) > $cutoff
WITH me, peer, count(*) AS overlap
WHERE overlap >= 2
ORDER BY overlap DESC
LIMIT $peerLimit
MATCH (peer)-[recVote:VOTED]->(candidate:Topic)
WHERE coalesce(recVote.voteType, CASE recVote.type WHEN 'up' THEN 1 ELSE -1 END) = 1
  AND coalesce(recVote.votedAt, recVote.createdAt, 0) > $cutoff
  AND candidate.createdAt > $cutoff
  AND NOT EXISTS { MATCH (me)-[:VOTED]->(candidate) }
OPTIONAL MATCH (candidate)-[:IN_SUBSTACK]->(s:Substack)
RETURN candidate.id AS topicId,
       coalesce(candidate.createdAt, 0) AS createdAt,
       candidate.substackId AS substackId,
       CASE WHEN coalesce(candidate.hotness, 0.0) <> 0.0 THEN candidate.hotness ELSE coalesce(candidate.score, candidate.voteScore, 0.0) END AS popularity,
       count(DISTINCT peer) AS peerCount,
       coalesce(s.subscriberCount, 0) AS subscriberCount,
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
       CASE WHEN coalesce(candidate.hotness, 0.0) <> 0.0 THEN candidate.hotness ELSE coalesce(candidate.score, candidate.voteScore, 0.0) END AS popularity,
       0 AS peerCount,
       coalesce(s.subscriberCount, 0) AS subscriberCount,
       true AS subscribed
ORDER BY candidate.createdAt DESC, popularity DESC
LIMIT $limit
`;

const trendingCandidatesCypher = `
MATCH (candidate:Topic)
WHERE candidate.createdAt > $cutoff
  AND ($substackId IS NULL OR candidate.substackId = $substackId)
OPTIONAL MATCH (candidate)-[:IN_SUBSTACK]->(s:Substack)
RETURN candidate.id AS topicId,
       coalesce(candidate.createdAt, 0) AS createdAt,
       candidate.substackId AS substackId,
       CASE WHEN coalesce(candidate.hotness, 0.0) <> 0.0 THEN candidate.hotness ELSE coalesce(candidate.score, candidate.voteScore, 0.0) END AS popularity,
       0 AS peerCount,
       coalesce(s.subscriberCount, 0) AS subscriberCount,
       false AS subscribed
ORDER BY popularity DESC, candidate.createdAt DESC
LIMIT $limit
`;

const similarUserCandidatesCypher = `
MATCH (me:User {id: $userId})-[sim:SIMILAR_TO]->(peer:User)
WITH me, peer, sim.score AS similarity
ORDER BY similarity DESC
LIMIT $peerLimit
MATCH (peer)-[recVote:VOTED]->(candidate:Topic)
WHERE coalesce(recVote.voteType, CASE recVote.type WHEN 'up' THEN 1 ELSE -1 END) = 1
  AND candidate.createdAt > $cutoff
  AND NOT EXISTS { MATCH (me)-[:VOTED]->(candidate) }
OPTIONAL MATCH (candidate)-[:IN_SUBSTACK]->(s:Substack)
RETURN candidate.id AS topicId,
       coalesce(candidate.createdAt, 0) AS createdAt,
       candidate.substackId AS substackId,
       CASE WHEN coalesce(candidate.hotness, 0.0) <> 0.0 THEN candidate.hotness ELSE coalesce(candidate.score, candidate.voteScore, 0.0) END AS popularity,
       count(DISTINCT peer) AS peerCount,
       coalesce(s.subscriberCount, 0) AS subscriberCount,
       false AS subscribed
ORDER BY peerCount DESC, popularity DESC
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
OPTIONAL MATCH (candidate)-[:IN_SUBSTACK]->(s:Substack)
RETURN candidate.id AS topicId,
       coalesce(candidate.createdAt, 0) AS createdAt,
       candidate.substackId AS substackId,
       CASE WHEN coalesce(candidate.hotness, 0.0) <> 0.0 THEN candidate.hotness ELSE coalesce(candidate.score, candidate.voteScore, 0.0) END AS popularity,
       count(DISTINCT u) AS peerCount,
       coalesce(s.subscriberCount, 0) AS subscriberCount,
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
OPTIONAL MATCH (candidate)-[:IN_SUBSTACK]->(s:Substack)
RETURN candidate.id AS topicId,
       coalesce(candidate.createdAt, 0) AS createdAt,
       candidate.substackId AS substackId,
       CASE WHEN coalesce(candidate.hotness, 0.0) <> 0.0 THEN candidate.hotness ELSE coalesce(candidate.score, candidate.voteScore, 0.0) END AS popularity,
       0 AS peerCount,
       coalesce(s.subscriberCount, 0) AS subscriberCount,
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
    {
      userId,
      cutoff,
      minVotes: toNeo4jInteger(10),
      peerLimit: toNeo4jInteger(50),
      limit: toNeo4jInteger(limit),
    },
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
  substackId: string | null = null,
): Promise<Candidate[]> {
  const cached = await getCachedTrending<Candidate>(substackId);
  if (cached) return cached.slice(0, limit);

  const candidates = await readTransaction(
    trendingCandidatesCypher,
    { cutoff, substackId, limit: toNeo4jInteger(limit) },
    (record) => mapCandidate(record, 'trending'),
  );

  await setCachedTrending(candidates, substackId);
  return candidates;
}

export async function getSimilarUserCandidates(
  userId: string,
  cutoff: number,
  limit: number,
): Promise<Candidate[]> {
  return readTransaction(
    similarUserCandidatesCypher,
    {
      userId,
      cutoff,
      peerLimit: toNeo4jInteger(30),
      limit: toNeo4jInteger(limit),
    },
    (record) => mapCandidate(record, 'similar-user'),
  );
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
      subscriberCount: Math.max(
        current.subscriberCount,
        candidate.subscriberCount,
      ),
      subscribed: current.subscribed || candidate.subscribed,
      sources: [...new Set([...current.sources, ...candidate.sources])],
      source: choosePrimarySource(current.source, candidate.source),
    });
  }

  return [...byId.values()];
}

function choosePrimarySource(
  current: Candidate['source'],
  next: Candidate['source'],
): Candidate['source'] {
  const priority: Record<Candidate['source'], number> = {
    collaborative: 4,
    'similar-user': 3,
    substack: 2,
    trending: 1,
    similar: 1,
  };

  return priority[next] > priority[current] ? next : current;
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
    subscriberCount: toNativeNumber(record.get('subscriberCount')),
    source,
    sources: [source],
    subscribed: Boolean(record.get('subscribed')),
  };
}
