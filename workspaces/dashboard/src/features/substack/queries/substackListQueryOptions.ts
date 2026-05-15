import { queryOptions } from '@alphacifer/react/query';

import {
  listSubstacks,
  type TListSubstacksParams,
} from '#/features/substack/api';

import { SUBSTACK_QUERY_KEYS } from './queryKeys';

export function substackListQueryOptions({
  limit,
  search,
}: TListSubstacksParams = {}) {
  return queryOptions({
    queryKey: [
      ...SUBSTACK_QUERY_KEYS.list,
      {
        limit,
        search,
      },
    ],
    queryFn: ({ signal }) => {
      return listSubstacks({
        limit,
        search,
        signal,
      });
    },
    staleTime: 30_000,
  });
}
