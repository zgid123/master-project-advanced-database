import { createFileRoute } from '@tanstack/react-router';

import { JobsPage } from '#/features/services/components';

export const Route = createFileRoute('/jobs')({
  component: JobsPage,
});
