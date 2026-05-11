import type { ScoredCandidate } from './types.js';

const mmrLambda = 0.7;

export function rerank(scored: ScoredCandidate[], k = 20): ScoredCandidate[] {
  const remaining = [...scored];
  const result: ScoredCandidate[] = [];

  while (result.length < k && remaining.length > 0) {
    remaining.sort((a, b) => mmrScore(b, result) - mmrScore(a, result));
    const top = remaining.shift();
    if (!top) break;

    result.push(top);
  }

  return result;
}

function mmrScore(
  candidate: ScoredCandidate,
  selected: ScoredCandidate[],
): number {
  const maxSimilarity = Math.max(
    0,
    ...selected.map((item) => substackSimilarity(candidate, item)),
  );

  return mmrLambda * candidate.score - (1 - mmrLambda) * maxSimilarity;
}

function substackSimilarity(
  left: ScoredCandidate,
  right: ScoredCandidate,
): number {
  if (!left.substackId || !right.substackId) return 0;
  return left.substackId === right.substackId ? 1 : 0;
}
