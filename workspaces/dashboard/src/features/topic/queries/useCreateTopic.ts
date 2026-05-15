import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTopic } from '../api/topicApi';
import { topicQueryKeys } from './queryKeys';

export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicQueryKeys.all });
    },
  });
}
