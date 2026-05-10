import type { ScoredCandidate } from './types.js';

export function rerank(scored: ScoredCandidate[], k = 20): ScoredCandidate[] {
  const remaining = [...scored];
  const result: ScoredCandidate[] = [];
  const substackCount = new Map<string, number>();

  while (result.length < k && remaining.length > 0) {
    remaining.sort(
      (a, b) =>
        adjustedScore(b, substackCount) - adjustedScore(a, substackCount),
    );
    const top = remaining.shift();
    if (!top) break;

    result.push(top);

    if (top.substackId) {
      substackCount.set(
        top.substackId,
        (substackCount.get(top.substackId) ?? 0) + 1,
      );
    }
  }

  return result;
}

function adjustedScore(
  candidate: ScoredCandidate,
  substackCount: Map<string, number>,
): number {
  const duplicatePenalty = candidate.substackId
    ? (substackCount.get(candidate.substackId) ?? 0) * 0.15
    : 0;

  return candidate.score - duplicatePenalty;
}
