import { createFileRoute } from '@tanstack/react-router';

import { TopicDetailPage } from '#/features/qna/pages/TopicDetailPage';

export const Route = createFileRoute('/topics/$id')({
  component: () => {
    const { id } = Route.useParams();
    return <TopicDetailPage topicId={id} />;
  },
});
