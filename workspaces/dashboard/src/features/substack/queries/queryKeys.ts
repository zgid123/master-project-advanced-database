import type { TQueryKey } from '@alphacifer/react/query';

export const SUBSTACK_QUERY_KEYS = {
  list: 'qk_substackList' satisfies TQueryKey,
  total: 'qk_substackTotal' satisfies TQueryKey,
  detail: 'qk_substackDetail' satisfies TQueryKey,
} as const;
