export type TComment = {
  id: string;
  topicId: string;
  userId: string;
  content: string;
  isAccepted: boolean;
  voteScore: number;
  userVote: number;
  createdAt: string;
  updatedAt: string;
};
