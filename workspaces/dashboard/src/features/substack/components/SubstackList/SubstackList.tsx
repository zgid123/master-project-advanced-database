import { useSuspenseQuery } from '@alphacifer/react/query';
import { Plus, Search } from 'lucide-react';
import { Suspense, useDeferredValue, useEffect, useState } from 'react';

import { Button } from '#/components/ui/button';
import { useSession } from '#/features/auth/queries/authQueries';
import { substackListQueryOptions } from '#/features/substack/queries';

import { SubstackFormModal } from '../SubstackForm';
import { MySubstackList } from './MySubstackList';
import { SubstackGrid } from './SubstackGrid';
import { SubstackListSkeleton } from './SubstackListSkeleton';

export function SubstackList() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: session, isPending } = useSession();
  const currentUser = session?.user;

  if (isPending || !mounted) {
    return null;
  }

  const filters = currentUser ? ['All', 'My Substacks'] : ['All'];

  return (
    <>
      <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div className='space-y-1'>
          <p className='island-kicker'>Explore Communities</p>
          <h1 className='display-title m-0 text-3xl font-bold text-sea-ink sm:text-4xl'>
            Substacks
          </h1>
          <p className='max-w-2xl text-sea-ink-soft'>
            Join focused communities to ask questions, share knowledge, and stay
            updated with the latest in your field of expertise.
          </p>
        </div>
        {currentUser && (
          <Button
            className='h-12 rounded-xl border border-lagoon/30 bg-lagoon/14 px-5 text-sm font-bold text-lagoon-deep hover:bg-lagoon/22'
            onClick={() => setIsOpen(true)}
            type='button'
          >
            <Plus className='size-5' />
            Create Substack
          </Button>
        )}
      </div>
      <div className='mb-8 flex flex-col gap-4 sm:flex-row'>
        <label className='flex h-12 flex-1 items-center gap-3 rounded-xl border border-line bg-chip-bg px-4 text-sea-ink-soft'>
          <Search className='size-5 shrink-0' />
          <input
            className='min-w-0 flex-1 bg-transparent text-base text-sea-ink outline-none placeholder:text-sea-ink-soft/70'
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search substacks by name or description...'
            type='search'
            value={search}
          />
        </label>
        <div className='flex gap-2'>
          {filters.map((filter) => (
            <Button
              className={`h-12 rounded-xl border px-5 font-semibold ${
                selectedFilter === filter
                  ? 'border-lagoon/30 bg-lagoon/14 text-lagoon-deep'
                  : 'border-transparent bg-sea-ink/10 text-sea-ink hover:bg-sea-ink/15'
              }`}
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              type='button'
              variant='secondary'
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      <Suspense fallback={<SubstackListSkeleton />}>
        {selectedFilter === 'All' && (
          <AllSubstackList search={deferredSearch} />
        )}
        {selectedFilter === 'My Substacks' && (
          <MySubstackList search={deferredSearch} />
        )}
      </Suspense>

      <SubstackFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

function AllSubstackList({ search }: { search: string }) {
  const { data: allSubstacks } = useSuspenseQuery(
    substackListQueryOptions({ search }),
  );
  return <SubstackGrid substacks={allSubstacks} />;
}
