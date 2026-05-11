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

export const Route = createFileRoute('/')({ component: App });

const substacks = [
  {
    name: 'Database Lab',
    members: '12.4k',
    unread: 18,
    tone: 'bg-lagoon/18 text-lagoon-deep border-lagoon/28',
  },
  {
    name: 'React Patterns',
    members: '8.9k',
    unread: 7,
    tone: 'bg-[#f59e0b]/14 text-[#f7c46b] border-[#f59e0b]/24',
  },
  {
    name: 'System Design',
    members: '21.2k',
    unread: 26,
    tone: 'bg-[#8b5cf6]/14 text-[#c4b5fd] border-[#8b5cf6]/24',
  },
  {
    name: 'DevOps Clinic',
    members: '6.1k',
    unread: 4,
    tone: 'bg-[#f43f5e]/12 text-[#fda4af] border-[#f43f5e]/20',
  },
  {
    name: 'API Gateway',
    members: '5.7k',
    unread: 11,
    tone: 'bg-[#22c55e]/12 text-[#86efac] border-[#22c55e]/22',
  },
  {
    name: 'Auth Systems',
    members: '7.3k',
    unread: 9,
    tone: 'bg-[#38bdf8]/12 text-[#7dd3fc] border-[#38bdf8]/22',
  },
  {
    name: 'Mongo Q&A',
    members: '4.8k',
    unread: 5,
    tone: 'bg-[#84cc16]/12 text-[#bef264] border-[#84cc16]/22',
  },
  {
    name: 'Product Feedback',
    members: '3.2k',
    unread: 3,
    tone: 'bg-[#ec4899]/12 text-[#f9a8d4] border-[#ec4899]/22',
  },
];

const totalSubstacks = 50;
const visibleSubstacks = substacks.slice(0, 8);

const questions = [
  {
    title: 'How should we model Reddit-style subscriptions with Q&A voting?',
    substack: 'Database Lab',
    excerpt:
      'I need users to subscribe to substacks, follow topics, and still keep accepted answers searchable.',
    votes: 42,
    answers: 9,
    views: '1.8k',
    tags: ['schema-design', 'postgres', 'drizzle'],
    status: 'Answered',
  },
  {
    title: 'Best way to merge StackOverflow answers and threaded comments?',
    substack: 'System Design',
    excerpt:
      'Answers need canonical ranking, but each answer should support discussion without diluting the main solution.',
    votes: 31,
    answers: 6,
    views: '940',
    tags: ['qna', 'comments', 'ranking'],
    status: 'Hot',
  },
  {
    title: 'Should substack moderators approve every new post?',
    substack: 'React Patterns',
    excerpt:
      'We want community-level moderation, creator ownership, and low friction posting for trusted members.',
    votes: 18,
    answers: 3,
    views: '512',
    tags: ['moderation', 'roles', 'ux'],
    status: 'Needs review',
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
  return (
    <main className='page-wrap px-4 pb-10 pt-8'>
      <section className='grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)_280px]'>
        <aside className='island-shell rise-in h-fit rounded-2xl p-4'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <div>
              <p className='island-kicker mb-1'>Substacks</p>
              <h1 className='m-0 text-lg font-bold text-sea-ink'>Communities</h1>
            </div>
            <button
              aria-label='Create substack'
              className='inline-flex size-9 items-center justify-center rounded-lg border border-lagoon/30 bg-lagoon/14 text-lagoon-deep hover:bg-lagoon/22'
              type='button'
            >
              <Plus className='size-4' />
            </button>
          </div>

          <div className='space-y-2'>
            {visibleSubstacks.map((substack) => (
              <button
                className='grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left hover:border-line hover:bg-white/5'
                key={substack.name}
                type='button'
              >
                <span>
                  <span className='block text-sm font-semibold text-sea-ink'>
                    {substack.name}
                  </span>
                  <span className='mt-0.5 flex items-center gap-1.5 text-xs text-sea-ink-soft'>
                    <UsersRound className='size-3.5' />
                    {substack.members}
                  </span>
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-bold ${substack.tone}`}
                >
                  {substack.unread}
                </span>
              </button>
            ))}
          </div>

          <a
            className='mt-4 flex h-10 items-center justify-center rounded-lg border border-line bg-white/5 px-3 text-sm font-bold text-lagoon-deep no-underline hover:bg-link-bg-hover'
            href='/substacks'
          >
            View all {totalSubstacks} substacks
          </a>
        </aside>

        <section className='min-w-0 space-y-5'>
          <div className='island-shell rise-in rounded-2xl p-5 sm:p-6'>
            <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
              <div>
                <p className='island-kicker mb-2'>Solvit Feed</p>
                <h2 className='display-title m-0 text-3xl font-bold text-sea-ink sm:text-4xl'>
                  Questions, answers, and substack discussions in one place.
                </h2>
              </div>
              <button
                className='inline-flex h-10 min-w-36 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-lagoon/35 bg-lagoon/16 px-4 text-sm font-bold text-lagoon-deep hover:bg-lagoon/24'
                type='button'
              >
                <Plus className='size-4' />
                Ask question
              </button>
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
                  <button
                    className='rounded-lg border border-line bg-white/5 px-3 py-2 text-sea-ink-soft hover:bg-link-bg-hover hover:text-sea-ink'
                    key={filter}
                    type='button'
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            {questions.map((question, index) => (
              <article
                className='feature-card rise-in grid gap-4 rounded-2xl border border-line p-4 md:grid-cols-[88px_minmax(0,1fr)]'
                key={question.title}
                style={{ animationDelay: `${index * 80 + 120}ms` }}
              >
                <div className='grid grid-cols-3 gap-2 text-center md:grid-cols-1'>
                  <Metric label='votes' value={question.votes} />
                  <Metric label='answers' strong value={question.answers} />
                  <Metric label='views' value={question.views} />
                </div>
                <div className='min-w-0'>
                  <div className='mb-2 flex flex-wrap items-center gap-2'>
                    <span className='rounded-full border border-lagoon/24 bg-lagoon/12 px-2.5 py-1 text-xs font-bold text-lagoon-deep'>
                      {question.substack}
                    </span>
                    <span className='rounded-full border border-[#f59e0b]/24 bg-[#f59e0b]/12 px-2.5 py-1 text-xs font-bold text-[#f7c46b]'>
                      {question.status}
                    </span>
                  </div>
                  <h3 className='m-0 text-lg font-bold leading-snug text-sea-ink'>
                    {question.title}
                  </h3>
                  <p className='my-2 text-sm leading-6 text-sea-ink-soft'>
                    {question.excerpt}
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {question.tags.map((tag) => (
                      <span
                        className='rounded-md border border-line bg-chip-bg px-2 py-1 text-xs font-semibold text-sea-ink-soft'
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
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
                    Use separate answer and reply collections so the solution
                    rank stays stable while discussion remains threaded.
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
    </main>
  );
}

function Metric({
  label,
  strong,
  value,
}: {
  label: string;
  strong?: boolean;
  value: number | string;
}) {
  return (
    <div
      className={`rounded-xl border px-2 py-2 ${
        strong
          ? 'border-lagoon/30 bg-lagoon/12 text-lagoon-deep'
          : 'border-line bg-white/5 text-sea-ink-soft'
      }`}
    >
      <div className='text-base font-extrabold text-sea-ink'>{value}</div>
      <div className='text-[0.68rem] font-bold uppercase tracking-[0.12em]'>
        {label}
      </div>
    </div>
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
