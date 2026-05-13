import type { TSubstackEntity } from '@domain/auth';

import { SubstackCard } from '../SubstackCard';

interface ISubstackGridProps {
  substacks: TSubstackEntity[];
  showStatus?: boolean;
}

export function SubstackGrid({
  substacks,
  showStatus = false,
}: ISubstackGridProps) {
  return (
    <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
      {substacks.map((substack, index) => (
        <SubstackCard
          data={{
            ...substack,
            members: `${(substack.name.length * 1.2).toFixed(1)}k`,
            topics: substack.name.length * 5,
          }}
          index={index}
          key={substack.id}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}
