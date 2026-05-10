// biome-ignore-all lint/style/useNamingConvention: API response fields and domain type aliases are intentional.
export type CandidateSource =
  | 'collaborative'
  | 'substack'
  | 'trending'
  | 'similar';

export type Candidate = {
  topicId: string;
  createdAt: number;
  substackId: string | null;
  popularity: number;
  peerCount: number;
  source: CandidateSource;
  subscribed: boolean;
};

export type UserContext = {
  userId: string;
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
};

export type FeedResponse = {
  items: FeedItem[];
  next_cursor: string | null;
};

export type SuggestedSubstack = {
  substackId: string;
  score: number;
  reason: 'peer_subscription';
};
