import { queryOptions } from '@alphacifer/react/query';

import { getOwnedSubstacks } from '#/features/substack/api';

import { SUBSTACK_QUERY_KEYS } from './queryKeys';

export function mySubstacksQueryOptions() {
  return queryOptions({
    queryKey: SUBSTACK_QUERY_KEYS.owned,
    queryFn: ({ signal }) => {
      return getOwnedSubstacks({ signal });
    },
    staleTime: 30_000,
  });
}
