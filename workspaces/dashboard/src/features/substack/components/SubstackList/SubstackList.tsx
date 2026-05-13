import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

import { Button } from '#/components/ui/button';
import { useSession } from '#/features/auth/queries/authQueries';
import { substackListQueryOptions } from '#/features/substack/queries';

import { SubstackCard } from '../SubstackCard';
import { SubstackFormModal } from '../SubstackForm';

export function SubstackList() {
  const { data: substacks } = useSuspenseQuery(substackListQueryOptions());
  const { data: session, isPending } = useSession();
  const currentUser = session?.user;
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isPending) {
    return null;
  }

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
            onClick={() => setIsCreateOpen(true)}
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
            placeholder='Search substacks by name or description...'
            type='search'
          />
        </label>
        <div className='flex gap-2'>
          {['All'].map((filter) => (
            <Button
              className='h-12 rounded-xl bg-sea-ink/10 px-5 font-semibold text-sea-ink hover:bg-sea-ink/15'
              key={filter}
              type='button'
              variant='secondary'
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

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
          />
        ))}
      </div>
      <SubstackFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => setIsCreateOpen(false)}
      />
    </>
  );
}
