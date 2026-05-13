import { createFileRoute } from '@tanstack/react-router';

import { TopicsPage } from '#/features/services/components';

export const Route = createFileRoute('/topics')({
  component: TopicsPage,
});
