export interface ITopic {
  id: string;
  slug: string;
  title: string;
  body?: string;
  userId: string;
  isSolved: boolean;
  createdAt: string;
  updatedAt: string;
  voteScore: number;
  deletedAt?: string;
  substackId?: string;
  commentsCount: number;
  isSubscribed?: boolean;
  subscriptionsCount: number;
  hasAcceptedAnswer?: boolean;
}

export interface ITopicPreview extends ITopic {
  tags?: string[];
  status?: string;
  replies?: number;
  views?: string | number;
}
