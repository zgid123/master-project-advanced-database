import { describe, expect, it } from 'vitest';

import { rerank } from '../../src/recommendation/rerank.js';
import type { ScoredCandidate } from '../../src/recommendation/types.js';

describe('rerank', () => {
  it('penalizes repeated substacks while preserving high-score candidates', () => {
    const candidates: ScoredCandidate[] = [
      scored('topic-a', 'substack-1', 10),
      scored('topic-b', 'substack-1', 9.9),
      scored('topic-c', 'substack-2', 9.8),
    ];

    expect(rerank(candidates, 3).map((candidate) => candidate.topicId)).toEqual(
      ['topic-a', 'topic-c', 'topic-b'],
    );
  });
});

function scored(
  topicId: string,
  substackId: string,
  score: number,
): ScoredCandidate {
  return {
    topicId,
    substackId,
    score,
    createdAt: 1,
    popularity: 0,
    peerCount: 0,
    subscriberCount: 0,
    source: 'collaborative',
    sources: ['collaborative'],
    subscribed: false,
  };
}
