import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateTopic } from '../api/topicApi';
import { topicQueryKeys } from './queryKeys';

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTopic,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: topicQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: topicQueryKeys.detail(data.id),
      });
    },
  });
}
