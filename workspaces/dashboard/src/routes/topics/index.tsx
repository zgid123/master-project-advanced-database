import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { Suspense, useDeferredValue, useState } from 'react';

import { authEvents } from '#/components/AuthModal';
import { Button } from '#/components/ui/button';
import { useSession } from '#/features/auth/queries';
import {
  TopicFormModal,
  TopicList,
  TopicListSkeleton,
} from '#/features/topic/components';

export const Route = createFileRoute('/topics/')({
  component: TopicsPageComponent,
});

function TopicsPageComponent() {
  const { data: session, isPending } = useSession();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const currentUser = session?.user;

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
          <Button
            className='h-11 border border-lagoon/35 bg-lagoon/10 font-bold text-lagoon-deep hover:bg-lagoon/18'
            onClick={() => {
              if (!currentUser) {
                authEvents.emit('open', {
                  message: 'You need to be logged in to ask a question.',
                });
                return;
              }
              setIsModalOpen(true);
            }}
            variant='outline'
          >
            + Ask question
          </Button>
        </div>
        <div className='flex flex-col gap-3 md:flex-row md:items-center'>
          <label className='flex h-11 flex-1 items-center gap-3 rounded-xl border border-line bg-chip-bg px-3 text-sea-ink-soft'>
            <Search className='size-4 shrink-0' />
            <input
              className='min-w-0 flex-1 bg-transparent text-sm text-sea-ink outline-none placeholder:text-sea-ink-soft/70'
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Search topics by title or summary'
              type='search'
              value={search}
            />
          </label>
        </div>
      </header>

      <Suspense fallback={<TopicListSkeleton />}>
        {!isPending && <TopicList query={deferredSearch} variant='feed' />}
      </Suspense>

      <TopicFormModal
        hideSubstackId={true}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
