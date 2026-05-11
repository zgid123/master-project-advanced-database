import type { TQueryKey } from '@alphacifer/react/query';

export const SUBSTACK_QUERY_KEYS = {
  list: 'qk_substackList' satisfies TQueryKey,
  total: 'qk_substackTotal' satisfies TQueryKey,
} as const;
