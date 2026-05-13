import { createFileRoute } from '@tanstack/react-router';

import { RecommendationsPage } from '#/features/services/components';

export const Route = createFileRoute('/recommendations')({
  component: RecommendationsPage,
});
