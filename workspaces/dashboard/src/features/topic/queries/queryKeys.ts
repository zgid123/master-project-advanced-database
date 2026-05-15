export const topicQueryKeys = {
  all: ['qk_topics'] as const,
  details: () => [...topicQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...topicQueryKeys.details(), id] as const,
  comments: (id: string) => [...topicQueryKeys.detail(id), 'comments'] as const,
};
