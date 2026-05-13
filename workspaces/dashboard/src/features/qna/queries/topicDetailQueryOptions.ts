import { queryOptions } from '@alphacifer/react/query';

import { getTopicDetail } from '../api';
import { QNA_QUERY_KEYS } from './queryKeys';

export function topicDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: [QNA_QUERY_KEYS.topic, { id }],
    queryFn: ({ signal }) => getTopicDetail({ id, signal }),
    staleTime: 10_000,
  });
}
