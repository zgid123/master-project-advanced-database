import { useMutation, useQueryClient } from '@tanstack/react-query';

import { voteTopic } from '../api/topicApi';
import { topicQueryKeys } from './queryKeys';

export function useVoteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: voteTopic,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: topicQueryKeys.detail(id) });
    },
  });
}
