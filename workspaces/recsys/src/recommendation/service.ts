// biome-ignore-all lint/style/useNamingConvention: response field next_cursor matches the service API contract.
import { getCachedFeed, setCachedFeed } from '../cache/feed-cache.js';
import {
  feedRequests,
  recommendationLatency,
} from '../observability/metrics.js';
import { tracer } from '../observability/tracing.js';
import {
  dedupeCandidates,
  getCollaborativeCandidates,
  getRelatedTopicCandidates,
  getSubstackCandidates,
  getSuggestedSubstacks,
  getTrendingCandidates,
  getUserSubscribedSubstackIds,
} from './candidates.js';
import { decodeCursor, encodeCursor, isAfterCursor } from './pagination.js';
import { rerank } from './rerank.js';
import { scoreCandidates } from './scoring.js';
import type {
  FeedItem,
  FeedResponse,
  SuggestedSubstack,
  UserContext,
} from './types.js';

const thirtyDaysSeconds = 30 * 24 * 60 * 60;

export async function getPersonalizedFeed(
  userId: string,
  limit: number,
  encodedCursor?: string,
): Promise<FeedResponse> {
  if (!encodedCursor && limit === 20) {
    const cached = await getCachedFeed(userId);
    if (cached) {
      feedRequests.inc({ cache: 'hit' });
      return cached;
    }
  }

  feedRequests.inc({ cache: 'miss' });
  const stopTimer = recommendationLatency.startTimer();

  try {
    return await tracer.startActiveSpan('recsys.feed', async (span) => {
      try {
        const cursor = decodeCursor(encodedCursor);
        const nowSeconds = Math.floor(Date.now() / 1_000);
        const cutoff = nowSeconds - thirtyDaysSeconds;
        const context: UserContext = {
          userId,
          nowSeconds,
          subscribedSubstacks: await getUserSubscribedSubstackIds(userId),
        };

        const [collaborative, substack, trending] = await Promise.all([
          getCollaborativeCandidates(userId, cutoff, 200),
          getSubstackCandidates(userId, cutoff, 100),
          getTrendingCandidates(cutoff, 100),
        ]);

        const candidates = dedupeCandidates([
          ...collaborative,
          ...substack,
          ...trending,
        ]);
        const scored = scoreCandidates(candidates, context).sort(
          (a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId),
        );
        const reranked = rerank(scored, Math.max(100, limit + 1));
        const page = reranked
          .filter((candidate) => isAfterCursor(candidate, cursor))
          .slice(0, limit + 1);

        const hasMore = page.length > limit;
        const items = page.slice(0, limit).map(toFeedItem);
        const last = items.at(-1);
        const response = {
          items,
          next_cursor:
            hasMore && last
              ? encodeCursor({ score: last.score, id: last.topicId })
              : null,
        };

        if (!encodedCursor && limit === 20) {
          await setCachedFeed(userId, response);
        }

        return response;
      } finally {
        span.end();
      }
    });
  } finally {
    stopTimer();
  }
}

export async function getSimilarTopics(
  topicId: string,
  limit: number,
): Promise<FeedResponse> {
  const nowSeconds = Math.floor(Date.now() / 1_000);
  const cutoff = nowSeconds - thirtyDaysSeconds;
  const candidates = await getRelatedTopicCandidates(
    topicId,
    cutoff,
    Math.max(limit + 1, 50),
  );
  const context: UserContext = {
    userId: 'anonymous',
    subscribedSubstacks: new Set(),
    nowSeconds,
  };
  const scored = scoreCandidates(candidates, context).sort(
    (a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId),
  );
  const items = rerank(scored, limit).map(toFeedItem);

  return {
    items,
    next_cursor: null,
  };
}

export async function suggestSubstacks(
  userId: string,
  limit: number,
): Promise<{ items: SuggestedSubstack[] }> {
  return {
    items: await getSuggestedSubstacks(userId, limit),
  };
}

function toFeedItem(candidate: {
  topicId: string;
  score: number;
  substackId: string | null;
  source: FeedItem['source'];
}): FeedItem {
  return {
    topicId: candidate.topicId,
    score: Number(candidate.score.toFixed(6)),
    substackId: candidate.substackId,
    source: candidate.source,
  };
}
