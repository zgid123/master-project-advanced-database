import { useSuspenseQuery } from '@alphacifer/react/query';

import { mySubstacksQueryOptions } from '#/features/substack/queries';

import { SubstackGrid } from './SubstackGrid';

export function MySubstackList() {
  const { data: substacks } = useSuspenseQuery(mySubstacksQueryOptions());
  return <SubstackGrid showStatus={true} substacks={substacks} />;
}
