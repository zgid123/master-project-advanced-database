import { useMutation, useQueryClient } from '@tanstack/react-query';

import { solveTopic } from '../api/topicApi';
import { topicQueryKeys } from './queryKeys';

export function useSolveTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: solveTopic,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: topicQueryKeys.detail(data.id),
      });
    },
  });
}
