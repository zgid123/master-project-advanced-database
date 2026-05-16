import { queryOptions } from '@alphacifer/react/query';

import { getTopicComments } from '../api/commentApi';
import { commentQueryKeys } from './queryKeys';

export function commentsQueryOptions(topicId: string) {
  return queryOptions({
    queryKey: commentQueryKeys.byTopic(topicId),
    queryFn: ({ signal }) => getTopicComments({ topicId, signal }),
    staleTime: 5_000,
  });
}
