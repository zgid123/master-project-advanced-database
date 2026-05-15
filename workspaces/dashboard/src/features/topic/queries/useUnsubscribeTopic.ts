import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unsubscribeTopic } from '../api/topicApi';
import { topicQueryKeys } from './queryKeys';

export function useUnsubscribeTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unsubscribeTopic,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: topicQueryKeys.detail(id) });
    },
  });
}
