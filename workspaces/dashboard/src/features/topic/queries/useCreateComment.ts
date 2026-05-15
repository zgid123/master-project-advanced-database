import { useCommand, useQueryClient } from '@alphacifer/react/query';

import { createComment } from '../api';
import { topicQueryKeys } from './queryKeys';

export function useCreateComment(topicId: string) {
  const queryClient = useQueryClient();
  return useCommand(createComment, {
    mutationKey: ['mk_createComment', topicId],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: topicQueryKeys.comments(topicId),
      });
    },
  });
}
