import { describe, expect, it } from 'vitest';

import { scoreCandidate } from '../../src/recommendation/scoring.js';
import type { Candidate, UserContext } from '../../src/recommendation/types.js';

describe('scoreCandidate', () => {
  const context: UserContext = {
    userId: 'user-1',
    nowSeconds: 1_000_000,
    subscribedSubstacks: new Set(['substack-1']),
  };

  it('boosts collaborative, popular, subscribed, recent candidates', () => {
    const candidate: Candidate = {
      topicId: 'topic-1',
      createdAt: context.nowSeconds,
      substackId: 'substack-1',
      popularity: 10,
      peerCount: 3,
      subscriberCount: 10,
      source: 'collaborative',
      sources: ['collaborative', 'substack'],
      subscribed: true,
    };

    expect(scoreCandidate(candidate, context)).toBeGreaterThan(1);
  });

  it('applies time decay to older candidates', () => {
    const fresh: Candidate = {
      topicId: 'fresh',
      createdAt: context.nowSeconds,
      substackId: null,
      popularity: 5,
      peerCount: 0,
      subscriberCount: 0,
      source: 'trending',
      sources: ['trending'],
      subscribed: false,
    };
    const old = {
      ...fresh,
      topicId: 'old',
      createdAt: context.nowSeconds - 72 * 3_600,
    };

    expect(scoreCandidate(old, context)).toBeLessThan(
      scoreCandidate(fresh, context),
    );
  });
});
