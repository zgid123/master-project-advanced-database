import { useSuspenseQuery } from '@alphacifer/react/query';

import { mySubstacksQueryOptions } from '#/features/substack/queries';

import { SubstackGrid } from './SubstackGrid';

export function MySubstackList({ search }: { search?: string }) {
  const { data: substacks } = useSuspenseQuery(mySubstacksQueryOptions({ search }));
  return <SubstackGrid showStatus={true} substacks={substacks} />;
}
