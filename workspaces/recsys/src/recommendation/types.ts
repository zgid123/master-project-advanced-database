// biome-ignore-all lint/style/useNamingConvention: API response fields and domain type aliases are intentional.
export type CandidateSource =
  | 'collaborative'
  | 'similar-user'
  | 'substack'
  | 'trending'
  | 'similar';

export type Candidate = {
  topicId: string;
  authorId?: string | null;
  createdAt: number;
  substackId: string | null;
  popularity: number;
  peerCount: number;
  subscriberCount: number;
  source: CandidateSource;
  sources: CandidateSource[];
  subscribed: boolean;
};

export type UserContext = {
  userId: string | null;
  subscribedSubstacks: Set<string>;
  nowSeconds: number;
};

export type ScoredCandidate = Candidate & {
  score: number;
};

export type FeedItem = {
  topicId: string;
  score: number;
  substackId: string | null;
  source: CandidateSource;
  sources: CandidateSource[];
};

export type FeedResponse = {
  items: FeedItem[];
  nextCursor: string | null;
  generatedAt: string;
  cacheHit: boolean;
};

export type SuggestedSubstack = {
  substackId: string;
  score: number;
  reason: 'peer_subscription';
};
