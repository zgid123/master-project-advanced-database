import { describe, expect, it } from 'vitest';

import { dedupeCandidates } from '../../src/recommendation/candidates.js';
import type { Candidate } from '../../src/recommendation/types.js';

describe('dedupeCandidates', () => {
  it('preserves all sources and keeps the strongest primary source', () => {
    const result = dedupeCandidates([
      candidate('topic-1', 'trending'),
      candidate('topic-1', 'substack'),
      candidate('topic-1', 'collaborative'),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      topicId: 'topic-1',
      source: 'collaborative',
      sources: ['trending', 'substack', 'collaborative'],
    });
  });
});

function candidate(topicId: string, source: Candidate['source']): Candidate {
  return {
    topicId,
    createdAt: 1,
    substackId: 'substack-1',
    popularity: 1,
    peerCount: 1,
    subscriberCount: 1,
    source,
    sources: [source],
    subscribed: false,
  };
}
