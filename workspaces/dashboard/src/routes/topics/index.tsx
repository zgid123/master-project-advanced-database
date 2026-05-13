import { createFileRoute } from '@tanstack/react-router';

import { TopicListSkeleton } from '#/features/qna/components';
import { TopicsPage } from '#/features/qna/pages/TopicsPage';
import { topicsQueryOptions } from '#/features/qna/queries';

export const Route = createFileRoute('/topics/')({
  component: TopicsPage,
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(
      topicsQueryOptions({ page: 1, limit: 10 }),
    );
  },
  pendingComponent: TopicListSkeleton,
});
