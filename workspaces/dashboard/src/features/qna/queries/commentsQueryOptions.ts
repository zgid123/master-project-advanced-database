import { queryOptions } from '@alphacifer/react/query';

import { getTopicComments } from '../api';
import { QNA_QUERY_KEYS } from './queryKeys';

export function commentsQueryOptions(topicId: string) {
  return queryOptions({
    queryKey: [QNA_QUERY_KEYS.comments, { topicId }],
    queryFn: ({ signal }) => getTopicComments({ topicId, signal }),
    staleTime: 5_000,
  });
}
