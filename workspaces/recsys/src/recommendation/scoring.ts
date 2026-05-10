import type { Candidate, ScoredCandidate, UserContext } from './types.js';

export function scoreCandidate(candidate: Candidate, ctx: UserContext): number {
  const ageHours = Math.max(0, (ctx.nowSeconds - candidate.createdAt) / 3_600);
  const timeDecay = Math.exp(-0.02 * ageHours);
  const collaborativeBoost =
    candidate.peerCount > 0 ? Math.log1p(candidate.peerCount) : 0;
  const popularityScore = candidate.popularity * 0.3;
  const subscribedBoost =
    candidate.substackId && ctx.subscribedSubstacks.has(candidate.substackId)
      ? 0.5
      : 0;
  const sourceBoost =
    candidate.source === 'substack'
      ? 0.25
      : candidate.source === 'trending'
        ? 0.1
        : 0;

  return (
    timeDecay *
    (collaborativeBoost + popularityScore + subscribedBoost + sourceBoost)
  );
}

export function scoreCandidates(
  candidates: Candidate[],
  ctx: UserContext,
): ScoredCandidate[] {
  return candidates.map((candidate) => ({
    ...candidate,
    score: scoreCandidate(candidate, ctx),
  }));
}
