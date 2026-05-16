import { useMutation, useQueryClient } from '@tanstack/react-query';

import { voteComment } from '../api/commentApi';
import { commentQueryKeys } from './queryKeys';

export function useVoteComment(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: voteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.byTopic(topicId),
      });
    },
  });
}
