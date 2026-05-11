import { setCachedPopularity } from '../cache/feed-cache.js';
import {
  toNativeNumber,
  toNativeString,
  writeTransaction,
} from '../neo4j/driver.js';
import { logger } from '../observability/logger.js';

const refreshPopularityCypher = `
MATCH (t:Topic)
OPTIONAL MATCH (t)<-[v:VOTED]-(:User)
WITH t,
     sum(CASE coalesce(v.voteType, CASE v.type WHEN 'up' THEN 1 ELSE -1 END)
       WHEN 1 THEN 1.0
       WHEN -1 THEN -1.0
       ELSE 0.0
     END) AS rawVoteScore,
     sum(CASE coalesce(v.voteType, CASE v.type WHEN 'up' THEN 1 ELSE -1 END)
       WHEN 1 THEN exp(-0.693 * ((timestamp() / 1000 - coalesce(v.votedAt, v.createdAt, timestamp() / 1000)) / 3600.0) / 24.0)
       ELSE 0.0
     END) AS hotness
SET t.voteScore = rawVoteScore,
    t.hotness = coalesce(hotness, 0.0),
    t.score = rawVoteScore,
    t.popularityUpdatedAt = timestamp()
RETURN t.id AS topicId, t.hotness AS score
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
    IN_SUBSTACK: {
      orientation: 'UNDIRECTED'
    }
  }
)
YIELD graphName
RETURN graphName
`;

const writeSimilarityCypher = `
CALL gds.fastRP.write('user-vote-graph', {
  embeddingDimension: 128,
  iterationWeights: [0.8, 1.0, 1.0],
  relationshipWeightProperty: 'weight',
  randomSeed: 7474,
  writeProperty: 'embedding'
})
YIELD nodePropertiesWritten
WITH nodePropertiesWritten
CALL gds.knn.write('user-vote-graph', {
  nodeLabels: ['User'],
  nodeProperties: ['embedding'],
  writeRelationshipType: 'SIMILAR_TO',
  writeProperty: 'score',
  similarityCutoff: 0.5,
  topK: 30
})
YIELD relationshipsWritten
RETURN relationshipsWritten, nodePropertiesWritten
`;

export async function refreshPopularityScores(): Promise<{
  topicsUpdated: number;
}> {
  const result = await writeTransaction(refreshPopularityCypher);

  await Promise.all(
    result.records.map((record: { get: (key: string) => unknown }) =>
      setCachedPopularity(
        toNativeString(record.get('topicId')),
        toNativeNumber(record.get('score')),
      ),
    ),
  );

  return {
    topicsUpdated: result.records.length,
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
  const result = await writeTransaction(writeSimilarityCypher);
  const row = result.records[0];

  return {
    relationshipsWritten: row
      ? toNativeNumber(row.get('relationshipsWritten'))
      : 0,
  };
}
