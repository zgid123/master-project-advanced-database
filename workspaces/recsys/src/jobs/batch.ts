import {
  toNativeNumber,
  toNeo4jInteger,
  writeTransaction,
} from '../neo4j/driver.js';
import { logger } from '../observability/logger.js';

const refreshPopularityCypher = `
MATCH (t:Topic)
OPTIONAL MATCH (t)<-[v:VOTED]-(:User)
WITH t,
     sum(CASE v.voteType
       WHEN 1 THEN 1.0
       WHEN -1 THEN -1.0
       ELSE 0.0
     END) AS rawVoteScore,
     sum(CASE v.voteType
       WHEN 1 THEN exp(-0.693 * ((timestamp() / 1000 - coalesce(v.votedAt, v.createdAt, timestamp() / 1000)) / 3600.0) / 24.0)
       ELSE 0.0
     END) AS hotness
SET t.voteScore = rawVoteScore,
    t.hotness = coalesce(hotness, 0.0),
    t.popularityUpdatedAt = timestamp()
RETURN count(t) AS topicsUpdated
`;

const dropGdsProjectionCypher = `
CALL gds.graph.drop('user-vote-graph', false)
YIELD graphName
RETURN graphName
`;

const createGdsProjectionCypher = `
CALL gds.graph.project(
  'user-vote-graph',
  ['User', 'Topic', 'Substack'],
  {
    VOTED: {
      orientation: 'UNDIRECTED',
      properties: 'weight'
    },
    SUBSCRIBED: {
      orientation: 'UNDIRECTED'
    },
    AUTHORED: {
      orientation: 'UNDIRECTED'
    },
    IN_SUBSTACK: {
      orientation: 'UNDIRECTED'
    }
  }
)
YIELD graphName
RETURN graphName
`;

const writeEmbeddingsCypher = `
CALL gds.fastRP.write('user-vote-graph', {
  embeddingDimension: 128,
  iterationWeights: [0.8, 1.0, 1.0],
  relationshipWeightProperty: 'weight',
  randomSeed: 7474,
  writeProperty: 'embedding'
})
YIELD nodePropertiesWritten
RETURN nodePropertiesWritten
`;

const writeKnnCypher = `
CALL gds.knn.write('user-vote-graph', {
  nodeLabels: ['User'],
  nodeProperties: ['embedding'],
  writeRelationshipType: 'SIMILAR_TO',
  writeProperty: 'score',
  similarityCutoff: 0.5,
  topK: 30
})
YIELD relationshipsWritten
RETURN relationshipsWritten
`;

const stampSimilarityComputedAtCypher = `
MATCH ()-[r:SIMILAR_TO]->()
SET r.computedAt = datetime()
RETURN count(r) AS stamped
`;

const pruneProcessedEventsCypher = `
MATCH (p:ProcessedEvent)
WHERE p.firstSeenAt < timestamp() - $retentionMs
WITH p
LIMIT $limit
DETACH DELETE p
RETURN count(p) AS deleted
`;

export async function refreshPopularityScores(): Promise<{
  topicsUpdated: number;
}> {
  const result = await writeTransaction(refreshPopularityCypher);
  const row = result.records[0];

  return {
    topicsUpdated: row ? toNativeNumber(row.get('topicsUpdated')) : 0,
  };
}

export async function refreshUserSimilarity(): Promise<{
  relationshipsWritten: number;
}> {
  try {
    await writeTransaction(dropGdsProjectionCypher);
  } catch (error) {
    logger.debug(
      { error },
      'gds graph projection did not exist before refresh',
    );
  }

  await writeTransaction(createGdsProjectionCypher);
  await writeTransaction(writeEmbeddingsCypher);
  const result = await writeTransaction(writeKnnCypher);
  await writeTransaction(stampSimilarityComputedAtCypher);
  const row = result.records[0];

  return {
    relationshipsWritten: row
      ? toNativeNumber(row.get('relationshipsWritten'))
      : 0,
  };
}

export async function pruneProcessedEvents(): Promise<{
  deleted: number;
}> {
  const result = await writeTransaction(pruneProcessedEventsCypher, {
    retentionMs: 7 * 24 * 60 * 60 * 1_000,
    limit: toNeo4jInteger(50_000),
  });
  const row = result.records[0];

  return {
    deleted: row ? toNativeNumber(row.get('deleted')) : 0,
  };
}
