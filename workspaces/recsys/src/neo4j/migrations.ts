import { writeTransaction } from './driver.js';

export const schemaStatements = [
  'CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
  'CREATE CONSTRAINT topic_id IF NOT EXISTS FOR (t:Topic) REQUIRE t.id IS UNIQUE',
  'CREATE CONSTRAINT comment_id IF NOT EXISTS FOR (c:Comment) REQUIRE c.id IS UNIQUE',
  'CREATE CONSTRAINT substack_id IF NOT EXISTS FOR (s:Substack) REQUIRE s.id IS UNIQUE',
  'CREATE CONSTRAINT processed_event_id IF NOT EXISTS FOR (e:ProcessedEvent) REQUIRE e.id IS UNIQUE',
  'DROP INDEX topic_score IF EXISTS',
  'DROP INDEX voted_created IF EXISTS',
  'DROP INDEX subscribed_created IF EXISTS',
  'CREATE INDEX topic_created IF NOT EXISTS FOR (t:Topic) ON (t.createdAt)',
  'CREATE INDEX topic_substack_id IF NOT EXISTS FOR (t:Topic) ON (t.substackId)',
  'CREATE INDEX topic_hotness IF NOT EXISTS FOR (t:Topic) ON (t.hotness)',
  'CREATE INDEX topic_substack_hotness IF NOT EXISTS FOR (t:Topic) ON (t.substackId, t.hotness)',
  'CREATE INDEX user_last_seen IF NOT EXISTS FOR (u:User) ON (u.lastSeenAt)',
  'CREATE INDEX voted_at IF NOT EXISTS FOR ()-[r:VOTED]-() ON (r.votedAt)',
  'CREATE INDEX subscribed_since IF NOT EXISTS FOR ()-[r:SUBSCRIBED]-() ON (r.since)',
  'CREATE INDEX similar_to_score IF NOT EXISTS FOR ()-[r:SIMILAR_TO]-() ON (r.score)',
  'CREATE INDEX similar_to_computed IF NOT EXISTS FOR ()-[r:SIMILAR_TO]-() ON (r.computedAt)',
  "MATCH ()-[r:VOTED]-() WHERE r.voteType IS NULL AND r.type = 'up' SET r.voteType = 1",
  "MATCH ()-[r:VOTED]-() WHERE r.voteType IS NULL AND r.type = 'down' SET r.voteType = -1",
  'MATCH ()-[r:VOTED]-() WHERE r.votedAt IS NULL SET r.votedAt = coalesce(r.createdAt, 0)',
  'MATCH ()-[r:VOTED]-() WHERE r.voteType IS NOT NULL REMOVE r.type',
  'MATCH (t:Topic) SET t.voteScore = coalesce(t.voteScore, t.score, 0.0), t.hotness = coalesce(t.hotness, t.score, t.voteScore, 0.0) REMOVE t.score',
  'MATCH (t:Topic)-[r:IN_SUBSTACK]->() WHERE r.since IS NULL SET r.since = coalesce(t.createdAt, 0)',
  'MATCH (t:Topic) WHERE t.authorId IS NOT NULL MERGE (u:User {id: t.authorId}) ON CREATE SET u.createdAt = coalesce(t.createdAt, 0) MERGE (u)-[a:AUTHORED]->(t) ON CREATE SET a.at = coalesce(t.createdAt, 0)',
  'MATCH (c:Comment) WHERE c.authorId IS NOT NULL MERGE (u:User {id: c.authorId}) ON CREATE SET u.createdAt = coalesce(c.createdAt, 0) MERGE (u)-[a:AUTHORED]->(c) ON CREATE SET a.at = coalesce(c.createdAt, 0)',
] as const;

export async function runMigrations(): Promise<void> {
  for (const statement of schemaStatements) {
    await writeTransaction(statement);
  }
}
