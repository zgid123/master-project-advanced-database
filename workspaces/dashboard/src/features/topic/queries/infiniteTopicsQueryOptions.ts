import { infiniteQueryOptions } from '@alphacifer/react/query';

import { searchTopics } from '../api';
import { topicQueryKeys } from './queryKeys';

export function infiniteTopicsQueryOptions({
  query,
  limit = 20,
  substackId,
}: {
  query?: string;
  limit?: number;
  substackId?: string;
}) {
  return infiniteQueryOptions({
    queryKey: [...topicQueryKeys.all, 'infinite', { query, limit, substackId }],
    queryFn: ({ pageParam = 1, signal }) =>
      searchTopics({
        query,
        page: pageParam as number,
        limit,
        substackId,
        signal,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}
