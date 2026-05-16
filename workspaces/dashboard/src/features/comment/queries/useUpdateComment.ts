import { useCommand, useQueryClient } from '@alphacifer/react/query';

import { updateComment } from '../api/commentApi';
import { commentQueryKeys } from './queryKeys';

export function useUpdateComment(topicId: string) {
  const queryClient = useQueryClient();
  return useCommand(updateComment, {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.byTopic(topicId),
      });
    },
  });
}
