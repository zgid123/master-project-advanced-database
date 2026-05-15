import {
  acquireFeedLock,
  getCachedFeed,
  releaseFeedLock,
  setCachedFeed,
  waitForCachedFeed,
} from '../cache/feed-cache.js';
import {
  candidatesPerFeed,
  feedRequests,
  recommendationLatency,
} from '../observability/metrics.js';
import { tracer } from '../observability/tracing.js';
import {
  dedupeCandidates,
  getCollaborativeCandidates,
  getRelatedTopicCandidates,
  getSimilarUserCandidates,
  getSimilarUsers,
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
  const cacheable = !encodedCursor;
  if (cacheable) {
    const cached = await getCachedFeed(userId, limit);
    if (cached) {
      feedRequests.inc({ cache: 'hit' });
      return cached;
    }
  }

  feedRequests.inc({ cache: 'miss' });
  const lockToken = cacheable ? await acquireFeedLock(userId) : null;

  if (cacheable && !lockToken) {
    const cached = await waitForCachedFeed(userId, limit);
    if (cached) {
      feedRequests.inc({ cache: 'coalesced' });
      return cached;
    }
  }

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

        const [collaborative, similarUsers, substackRaw, trendingRaw] =
          await Promise.all([
            getCollaborativeCandidates(userId, cutoff, 200),
            getSimilarUserCandidates(userId, cutoff, 200),
            getSubstackCandidates(userId, cutoff, 100),
            getTrendingCandidates(100),
          ]);

        const substack = substackRaw.filter((c) => c.authorId !== userId);
        const trending = trendingRaw.filter((c) => c.authorId !== userId);
        candidatesPerFeed.observe(
          { source: 'collaborative' },
          collaborative.length,
        );
        candidatesPerFeed.observe(
          { source: 'similar-user' },
          similarUsers.length,
        );
        candidatesPerFeed.observe({ source: 'substack' }, substack.length);
        candidatesPerFeed.observe({ source: 'trending' }, trending.length);

        const candidates = dedupeCandidates([
          ...collaborative,
          ...similarUsers,
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
        const nextCursor =
          hasMore && last
            ? encodeCursor({ score: last.score, id: last.topicId })
            : null;
        const response = {
          items,
          nextCursor,
          generatedAt: new Date().toISOString(),
          cacheHit: false,
        };

        if (cacheable && lockToken) {
          await setCachedFeed(userId, limit, response);
        }

        return response;
      } finally {
        span.end();
      }
    });
  } finally {
    stopTimer();
    if (lockToken) {
      await releaseFeedLock(userId, lockToken);
    }
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
    userId: null,
    subscribedSubstacks: new Set(),
    nowSeconds,
  };
  const scored = scoreCandidates(candidates, context).sort(
    (a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId),
  );
  const items = rerank(scored, limit).map(toFeedItem);

  return {
    items,
    nextCursor: null,
    generatedAt: new Date().toISOString(),
    cacheHit: false,
  };
}

export async function getTrendingFeed(
  limit: number,
  substackId: string | null = null,
): Promise<FeedResponse> {
  const nowSeconds = Math.floor(Date.now() / 1_000);
  const candidates = await getTrendingCandidates(limit, substackId);
  const items = scoreCandidates(candidates, {
    userId: null,
    subscribedSubstacks: new Set(),
    nowSeconds,
  })
    .sort((a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId))
    .slice(0, limit)
    .map(toFeedItem);

  return {
    items,
    nextCursor: null,
    generatedAt: new Date().toISOString(),
    cacheHit: false,
  };
}

export async function getUserSimilarUsers(
  userId: string,
  limit: number,
): Promise<{ items: Array<{ userId: string; score: number }> }> {
  return {
    items: await getSimilarUsers(userId, limit),
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
  sources: FeedItem['sources'];
}): FeedItem {
  return {
    topicId: candidate.topicId,
    score: Number(candidate.score.toFixed(6)),
    substackId: candidate.substackId,
    source: candidate.source,
    sources: candidate.sources,
  };
}
