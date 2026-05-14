import { createFileRoute } from '@tanstack/react-router';

import { CommentListSkeleton } from '#/features/qna/components';
import { TopicDetailPage } from '#/features/qna/pages/TopicDetailPage';
import {
  commentsQueryOptions,
  topicDetailQueryOptions,
} from '#/features/qna/queries';

export const Route = createFileRoute('/topics/$id')({
  component: () => {
    const { id } = Route.useParams();
    return <TopicDetailPage topicId={id} />;
  },
  loader: ({ context: { queryClient }, params }) => {
    return Promise.all([
      queryClient.ensureQueryData(topicDetailQueryOptions(params.id)),
      queryClient.ensureQueryData(commentsQueryOptions(params.id)),
    ]);
  },
  pendingComponent: CommentListSkeleton,
});
