import { writeTransaction } from './driver.js';

export const schemaStatements = [
  'CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
  'CREATE CONSTRAINT topic_id IF NOT EXISTS FOR (t:Topic) REQUIRE t.id IS UNIQUE',
  'CREATE CONSTRAINT comment_id IF NOT EXISTS FOR (c:Comment) REQUIRE c.id IS UNIQUE',
  'CREATE CONSTRAINT substack_id IF NOT EXISTS FOR (s:Substack) REQUIRE s.id IS UNIQUE',
  'CREATE CONSTRAINT processed_event_id IF NOT EXISTS FOR (e:ProcessedEvent) REQUIRE e.id IS UNIQUE',
  'CREATE INDEX topic_created IF NOT EXISTS FOR (t:Topic) ON (t.createdAt)',
  'CREATE INDEX topic_substack_id IF NOT EXISTS FOR (t:Topic) ON (t.substackId)',
  'CREATE INDEX topic_hotness IF NOT EXISTS FOR (t:Topic) ON (t.hotness)',
  'CREATE INDEX topic_substack_hotness IF NOT EXISTS FOR (t:Topic) ON (t.substackId, t.hotness)',
  'CREATE INDEX topic_score IF NOT EXISTS FOR (t:Topic) ON (t.score)',
  'CREATE INDEX user_last_seen IF NOT EXISTS FOR (u:User) ON (u.lastSeenAt)',
  'CREATE INDEX voted_at IF NOT EXISTS FOR ()-[r:VOTED]-() ON (r.votedAt)',
  'CREATE INDEX voted_created IF NOT EXISTS FOR ()-[r:VOTED]-() ON (r.createdAt)',
  'CREATE INDEX subscribed_since IF NOT EXISTS FOR ()-[r:SUBSCRIBED]-() ON (r.since)',
  'CREATE INDEX subscribed_created IF NOT EXISTS FOR ()-[r:SUBSCRIBED]-() ON (r.createdAt)',
  'CREATE INDEX similar_to_score IF NOT EXISTS FOR ()-[r:SIMILAR_TO]-() ON (r.score)',
  'CREATE INDEX similar_to_computed IF NOT EXISTS FOR ()-[r:SIMILAR_TO]-() ON (r.computedAt)',
] as const;

export async function runMigrations(): Promise<void> {
  for (const statement of schemaStatements) {
    await writeTransaction(statement);
  }
}
