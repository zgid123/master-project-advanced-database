export type TTopic = {
  id: string;
  title: string;
  body?: string;
  slug: string;
  isSolved: boolean;
  userId: string;
  substackId?: string;
  createdAt: string;
  updatedAt: string;
  voteScore: number;
  commentsCount: number;
  subscriptionsCount: number;
  hasAcceptedAnswer: boolean;
  isSubscribed: boolean;
};

export type TComment = {
  id: string;
  topicId: string;
  userId: string;
  content: string;
  isAccepted: boolean;
  voteScore: number;
  createdAt: string;
  updatedAt: string;
};

export type TPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TSearchTopicsResponse = {
  data: TTopic[];
  pagination: TPagination;
};
