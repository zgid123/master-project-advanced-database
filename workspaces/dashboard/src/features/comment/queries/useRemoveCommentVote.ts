import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteCommentVote } from '../api/commentApi';
import { commentQueryKeys } from './queryKeys';

export function useRemoveCommentVote(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCommentVote,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.byTopic(topicId),
      });
    },
  });
}
