import { queryOptions } from '@alphacifer/react/query';

import { searchTopics } from '../api';
import { QNA_QUERY_KEYS } from './queryKeys';

export function topicsQueryOptions({
  query,
  page,
  limit,
  substackId,
}: {
  query?: string;
  page: number;
  limit: number;
  substackId?: string;
}) {
  return queryOptions({
    queryKey: [QNA_QUERY_KEYS.topics, { query, page, limit, substackId }],
    queryFn: ({ signal }) =>
      searchTopics({
        query,
        page,
        limit,
        substackId,
        signal,
      }),
    staleTime: 10_000,
  });
}
