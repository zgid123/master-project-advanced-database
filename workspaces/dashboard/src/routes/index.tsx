import { createFileRoute } from '@tanstack/react-router';
import {
  Bell,
  Bookmark,
  CheckCircle2,
  ChevronUp,
  Flame,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Suspense, useDeferredValue, useEffect, useState } from 'react';

import { authEvents } from '#/components/AuthModal';
import { Button } from '#/components/ui/button';
import { useSession } from '#/features/auth/queries';
import { SubstacksIsland } from '#/features/substack/components';
import {
  TopicFormModal,
  TopicList,
  TopicListSkeleton,
} from '#/features/topic/components';

export const Route = createFileRoute('/')({
  component: App,
});

const discussions = [
  {
    author: 'Mina Tran',
    text: 'Pinned a canonical answer and moved implementation debate into comments.',
    time: '8m',
  },
  {
    author: 'Oscar Reid',
    text: 'Shared a migration checklist for topic subscriptions.',
    time: '16m',
  },
  {
    author: 'Nadia Pham',
    text: 'Opened a proposal to split answers from discussion replies.',
    time: '34m',
  },
];

function App() {
  const { data: session, isPending } = useSession();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentUser = session?.user;

  if (isPending || !mounted) {
    return null;
  }

  return (
    <section className='grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_280px]'>
      <SubstacksIsland />
      <section className='min-w-0 space-y-5'>
        <div className='island-shell rise-in rounded-2xl p-5 sm:p-6'>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
            <div>
              <p className='island-kicker mb-2'>Solvit Feed</p>
              <h2 className='display-title m-0 text-3xl font-bold text-sea-ink sm:text-4xl'>
                Questions, answers, and substack discussions in one place.
              </h2>
            </div>
            <Button
              className='h-10 min-w-36 shrink-0 border border-lagoon/35 bg-lagoon/16 font-bold text-lagoon-deep hover:bg-lagoon/24'
              onClick={() => {
                if (!currentUser) {
                  authEvents.emit('open', {
                    message: 'You need to be logged in to ask a question.',
                  });
                  return;
                }
                setIsModalOpen(true);
              }}
              type='button'
              variant='secondary'
            >
              <Plus className='size-4' />
              Ask question
            </Button>
          </div>
          <div className='mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]'>
            <label className='flex h-11 min-w-0 items-center gap-3 rounded-xl border border-line bg-chip-bg px-3 text-sea-ink-soft'>
              <Search className='size-4 shrink-0' />
              <input
                className='min-w-0 flex-1 bg-transparent text-sm text-sea-ink outline-none placeholder:text-sea-ink-soft/70'
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search questions, substacks, tags'
                type='search'
                value={search}
              />
            </label>
            <div className='grid grid-cols-3 gap-2 text-sm font-semibold'>
              {['Hot', 'Newest', 'Unanswered'].map((filter) => (
                <Button
                  className='h-auto border border-line bg-white/5 px-3 py-2 text-sea-ink-soft hover:bg-link-bg-hover hover:text-sea-ink'
                  key={filter}
                  type='button'
                  variant='ghost'
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className='space-y-3'>
          <Suspense fallback={<TopicListSkeleton />}>
            <TopicList query={deferredSearch} />
          </Suspense>
        </div>

        <TopicFormModal
          hideSubstackId={true}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </section>
      <aside className='space-y-5'>
        <section className='island-shell rise-in rounded-2xl p-4'>
          <div className='mb-4 flex items-center justify-between'>
            <p className='island-kicker m-0'>Thread Pulse</p>
            <Flame className='size-4 text-[#f7c46b]' />
          </div>
          <div className='rounded-xl border border-line bg-white/5 p-4'>
            <div className='flex items-start gap-3'>
              <div className='rounded-lg border border-lagoon/24 bg-lagoon/12 p-2 text-lagoon-deep'>
                <CheckCircle2 className='size-4' />
              </div>
              <div>
                <h3 className='m-0 text-sm font-bold text-sea-ink'>
                  Accepted answer
                </h3>
                <p className='mt-1 mb-3 text-sm leading-6 text-sea-ink-soft'>
                  Use separate answer and reply collections so the solution rank
                  stays stable while discussion remains threaded.
                </p>
                <div className='flex items-center gap-2 text-xs font-bold text-sea-ink-soft'>
                  <ChevronUp className='size-3.5 text-lagoon-deep' />
                  86 helpful votes
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className='island-shell rise-in rounded-2xl p-4'>
          <div className='mb-4 flex items-center justify-between'>
            <p className='island-kicker m-0'>Activity</p>
            <Bell className='size-4 text-lagoon-deep' />
          </div>
          <div className='space-y-3'>
            {discussions.map((item) => (
              <div
                className='grid grid-cols-[32px_minmax(0,1fr)] gap-3'
                key={`${item.author}-${item.time}`}
              >
                <div className='flex size-8 items-center justify-center rounded-lg border border-line bg-chip-bg text-xs font-bold text-sea-ink'>
                  {item.author
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <div>
                  <p className='m-0 text-sm leading-5 text-sea-ink'>
                    <span className='font-bold'>{item.author}</span>{' '}
                    <span className='text-sea-ink-soft'>{item.text}</span>
                  </p>
                  <p className='mt-1 mb-0 text-xs font-semibold text-sea-ink-soft'>
                    {item.time} ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className='island-shell rise-in rounded-2xl p-4'>
          <p className='island-kicker mb-3'>Saved Work</p>
          <div className='grid grid-cols-2 gap-3'>
            <SmallStat
              icon={<Bookmark className='size-4' />}
              label='Bookmarks'
              value='128'
            />
            <SmallStat
              icon={<MessageSquare className='size-4' />}
              label='Drafts'
              value='5'
            />
            <SmallStat
              icon={<Sparkles className='size-4' />}
              label='Bounties'
              value='12'
            />
            <SmallStat
              icon={<UsersRound className='size-4' />}
              label='Follows'
              value='34'
            />
          </div>
        </section>
      </aside>
    </section>
  );
}

function SmallStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className='rounded-xl border border-line bg-white/5 p-3'>
      <div className='mb-3 text-lagoon-deep'>{icon}</div>
      <div className='text-lg font-extrabold text-sea-ink'>{value}</div>
      <div className='text-xs font-semibold text-sea-ink-soft'>{label}</div>
    </div>
  );
}
