import type { Candidate, ScoredCandidate, UserContext } from './types.js';

const daySeconds = 24 * 60 * 60;
const voteHalfLifeDays = 7;
const hotnessHalfLifeDays = 1;

export function scoreCandidate(candidate: Candidate, ctx: UserContext): number {
  const ageDays = Math.max(
    0,
    (ctx.nowSeconds - candidate.createdAt) / daySeconds,
  );
  const voteDecay = halfLifeDecay(ageDays, voteHalfLifeDays);
  const hotnessDecay = halfLifeDecay(ageDays, hotnessHalfLifeDays);
  const personalSignal =
    candidate.peerCount > 0 ? Math.log1p(candidate.peerCount) * voteDecay : 0;
  const normalizedPopularity =
    candidate.popularity / Math.max(1, Math.log1p(candidate.subscriberCount));
  const subscribedBoost =
    candidate.substackId && ctx.subscribedSubstacks.has(candidate.substackId)
      ? 1
      : 0;
  const multiSourceBoost = Math.max(0, candidate.sources.length - 1) * 0.05;
  // Freshness and multi-source boosts are applied before MMR reranking.
  const freshBoost = ageDays < 1 ? 1 + 0.2 * Math.exp(-(ageDays * 24) / 12) : 1;

  return (
    (0.6 * personalSignal +
      0.3 * normalizedPopularity * hotnessDecay +
      0.1 * subscribedBoost +
      multiSourceBoost) *
    freshBoost
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

function halfLifeDecay(ageDays: number, halfLifeDays: number): number {
  return Math.exp((-Math.log(2) * ageDays) / halfLifeDays);
}
