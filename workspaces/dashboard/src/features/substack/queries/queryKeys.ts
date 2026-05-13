import type { TQueryKey } from '@alphacifer/react/query';

export const SUBSTACK_QUERY_KEYS = {
  root: ['substack'] as const,
  list: ['substack', 'list'] as const,
  total: ['substack', 'total'] as const,
  owned: ['substack', 'owned'] as const,
  detail: ['substack', 'detail'] as const,
} as const;
