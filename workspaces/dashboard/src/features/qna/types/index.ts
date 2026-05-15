import type { TPagination, TTopic } from '#/features/topic/types';

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

export type TSearchTopicsResponse = {
  data: TTopic[];
  pagination: TPagination;
};
