export const commentQueryKeys = {
  all: ['qk_comments'] as const,
  byTopic: (topicId: string) => [...commentQueryKeys.all, { topicId }] as const,
};
