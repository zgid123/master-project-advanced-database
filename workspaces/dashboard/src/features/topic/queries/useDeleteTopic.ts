import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteTopic } from '../api/topicApi';
import { topicQueryKeys } from './queryKeys';

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicQueryKeys.all });
    },
  });
}
