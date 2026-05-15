import { useState, Suspense } from 'react';
import { Search } from 'lucide-react';

import { useSession } from '#/features/auth/queries';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { TopicList, TopicListSkeleton } from '#/features/topic/components';

export function TopicsPage() {
  const { isPending } = useSession();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);

  return (
    <section className='space-y-6'>
      <header className='flex flex-col gap-4 rounded-2xl border border-line bg-white/5 p-6 shadow-sm'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='island-kicker'>Community Q&A</p>
            <h1 className='m-0 text-3xl font-bold text-sea-ink sm:text-4xl'>
              Questions
            </h1>
            <p className='mt-2 text-sm text-sea-ink-soft'>
              Ask, vote, and follow answers from the community.
            </p>
          </div>
        </div>
        <div className='flex flex-col gap-3 md:flex-row md:items-center'>
          <label className='flex h-11 flex-1 items-center gap-3 rounded-xl border border-line bg-chip-bg px-3 text-sea-ink-soft'>
            <Search className='size-4 shrink-0' />
            <input
              className='min-w-0 flex-1 bg-transparent text-sm text-sea-ink outline-none placeholder:text-sea-ink-soft/70'
              placeholder='Search topics by title or summary'
              type='search'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
      </header>

      <Suspense fallback={<TopicListSkeleton />}>
        {!isPending && <TopicList query={debouncedSearch} variant="community" />}
      </Suspense>
    </section>
  );
}
