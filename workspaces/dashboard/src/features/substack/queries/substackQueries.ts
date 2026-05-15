import { useCommand, useQueryClient } from '@alphacifer/react/query';

import { deleteSubstack } from '#/features/substack/api';

import { SUBSTACK_QUERY_KEYS } from './queryKeys';

export function useDeleteSubstackCommand() {
  const queryClient = useQueryClient();

  return useCommand((slug: string) => deleteSubstack(slug), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SUBSTACK_QUERY_KEYS.root,
      });
    },
  });
}
