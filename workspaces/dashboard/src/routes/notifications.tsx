import { createFileRoute } from '@tanstack/react-router';

import { NotificationsPage } from '#/features/services/components';

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
});
