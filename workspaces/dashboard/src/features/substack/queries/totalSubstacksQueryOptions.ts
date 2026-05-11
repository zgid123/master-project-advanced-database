import { queryOptions } from '@alphacifer/react/query';

import { getTotalSubstacks } from '#/features/substack/api';

import { SUBSTACK_QUERY_KEYS } from './queryKeys';

export function totalSubstacksQueryOptions() {
  return queryOptions({
    queryKey: [SUBSTACK_QUERY_KEYS.total],
    queryFn: ({ signal }) => {
      return getTotalSubstacks({
        signal,
      });
    },
    staleTime: 30_000,
  });
}
