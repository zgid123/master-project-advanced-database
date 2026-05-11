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

import { authEvents } from '#/components/AuthModal';
import { Button } from '#/components/ui/button';
import { useSession } from '#/features/auth/queries';
import { SubstacksIsland } from '#/features/substack/components';
import { TopicCard } from '#/features/topic/components';

export const Route = createFileRoute('/')({
  component: App,
});

const questions = [
  {
    id: '1',
    title: 'How should we model Reddit-style subscriptions with Q&A voting?',
    substackId: 'Database Lab',
    body: 'I need users to subscribe to substacks, follow topics, and still keep accepted answers searchable.',
    voteScore: 42,
    commentsCount: 9,
    views: '1.8k',
    tags: ['schema-design', 'postgres', 'drizzle'],
    status: 'Answered',
    isSolved: true,
    slug: 'reddit-style-subscriptions',
    userId: 'user-1',
    createdAt: '2023-10-01T10:00:00Z',
    updatedAt: '2023-10-01T10:00:00Z',
    subscriptionsCount: 5,
  },
  {
    id: '2',
    title: 'Best way to merge StackOverflow answers and threaded comments?',
    substackId: 'System Design',
    body: 'Answers need canonical ranking, but each answer should support discussion without diluting the main solution.',
    voteScore: 31,
    commentsCount: 6,
    views: '940',
    tags: ['qna', 'comments', 'ranking'],
    status: 'Hot',
    isSolved: false,
    slug: 'merge-stackoverflow-answers',
    userId: 'user-2',
    createdAt: '2023-10-02T11:00:00Z',
    updatedAt: '2023-10-02T11:00:00Z',
    subscriptionsCount: 3,
  },
  {
    id: '3',
    title: 'Should substack moderators approve every new post?',
    substackId: 'React Patterns',
    body: 'We want community-level moderation, creator ownership, and low friction posting for trusted members.',
    voteScore: 18,
    commentsCount: 3,
    views: '512',
    tags: ['moderation', 'roles', 'ux'],
    status: 'Needs review',
    isSolved: false,
    slug: 'substack-moderators-approve',
    userId: 'user-3',
    createdAt: '2023-10-03T12:00:00Z',
    updatedAt: '2023-10-03T12:00:00Z',
    subscriptionsCount: 1,
  },
];

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
  const currentUser = session?.user;

  if (isPending) {
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
                }
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
                placeholder='Search questions, substacks, tags'
                type='search'
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
          {questions.map((question, index) => (
            <TopicCard
              data={question}
              index={index}
              key={question.title}
              variant='feed'
            />
          ))}
        </div>
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
