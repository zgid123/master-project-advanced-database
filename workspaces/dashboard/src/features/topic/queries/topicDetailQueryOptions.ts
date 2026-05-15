import { queryOptions } from '@alphacifer/react/query';

import { getTopicDetail } from '../api/topicApi';
import { topicQueryKeys } from './queryKeys';

export function topicDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: topicQueryKeys.detail(id),
    queryFn: ({ signal }) => getTopicDetail({ id, signal }),
    staleTime: 10_000,
  });
}
