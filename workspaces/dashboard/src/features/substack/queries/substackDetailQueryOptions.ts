import { queryOptions } from '@alphacifer/react/query';

import { getSubstackBySlug } from '#/features/substack/api';

import { SUBSTACK_QUERY_KEYS } from './queryKeys';

export function substackDetailQueryOptions({ slug }: { slug: string }) {
  return queryOptions({
    queryKey: [
      ...SUBSTACK_QUERY_KEYS.detail,
      {
        slug,
      },
    ],
    queryFn: ({ signal }) => {
      return getSubstackBySlug({
        slug,
        signal,
      });
    },
    staleTime: 30_000,
  });
}
