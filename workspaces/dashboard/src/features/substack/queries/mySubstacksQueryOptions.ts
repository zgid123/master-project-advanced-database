import { queryOptions } from '@alphacifer/react/query';

import { getOwnedSubstacks } from '#/features/substack/api';

import { SUBSTACK_QUERY_KEYS } from './queryKeys';

export function mySubstacksQueryOptions({ search }: { search?: string } = {}) {
  return queryOptions({
    queryKey: [...SUBSTACK_QUERY_KEYS.owned, { search }],
    queryFn: ({ signal }) => {
      return getOwnedSubstacks({ search, signal });
    },
    staleTime: 30_000,
  });
}
