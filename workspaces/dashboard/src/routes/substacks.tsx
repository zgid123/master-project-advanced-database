import { createFileRoute } from '@tanstack/react-router';

import {
  SubstackList,
  SubstackListSkeleton,
} from '#/features/substack/components';
import { substackListQueryOptions } from '#/features/substack/queries';

export const Route = createFileRoute('/substacks')({
  component: SubstackList,
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(substackListQueryOptions());
  },
  pendingComponent: SubstackListSkeleton,
});
