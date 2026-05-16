import { useMutation, useQueryClient } from '@tanstack/react-query';

import { removeTopicVote } from '../api/topicApi';
import { topicQueryKeys } from './queryKeys';

export function useRemoveTopicVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeTopicVote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicQueryKeys.all });
    },
  });
}
