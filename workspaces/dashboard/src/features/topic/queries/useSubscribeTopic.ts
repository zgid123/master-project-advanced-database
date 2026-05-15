import { useMutation, useQueryClient } from '@tanstack/react-query';

import { subscribeTopic } from '../api/topicApi';
import { topicQueryKeys } from './queryKeys';

export function useSubscribeTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subscribeTopic,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: topicQueryKeys.detail(id) });
    },
  });
}
