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
     sum(CASE v.type WHEN 'up' THEN 1.0 WHEN 'down' THEN -1.0 ELSE 0.0 END) AS rawVoteScore,
     count(v) AS voteCount
SET t.score = rawVoteScore + log10(1.0 + voteCount),
    t.popularityUpdatedAt = timestamp()
RETURN t.id AS topicId, t.score AS score
`;

const dropGdsProjectionCypher = `
CALL gds.graph.drop('user-vote-graph', false)
YIELD graphName
RETURN graphName
`;

const createGdsProjectionCypher = `
CALL gds.graph.project(
  'user-vote-graph',
  ['User', 'Topic'],
  {
    VOTED: {
      orientation: 'UNDIRECTED',
      properties: 'weight'
    }
  }
)
YIELD graphName
RETURN graphName
`;

const writeSimilarityCypher = `
CALL gds.nodeSimilarity.write('user-vote-graph', {
  writeRelationshipType: 'SIMILAR_TO',
  writeProperty: 'score',
  similarityCutoff: 0.5,
  topK: 50,
  relationshipWeightProperty: 'weight'
})
YIELD relationshipsWritten
RETURN relationshipsWritten
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
