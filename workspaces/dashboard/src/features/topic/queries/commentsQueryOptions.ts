import { queryOptions } from '@alphacifer/react/query';

import { getTopicComments } from '../api';
import { topicQueryKeys } from './queryKeys';

export function commentsQueryOptions(topicId: string) {
  return queryOptions({
    queryKey: topicQueryKeys.comments(topicId),
    queryFn: ({ signal }) => getTopicComments({ topicId, signal }),
    staleTime: 5_000,
  });
}
