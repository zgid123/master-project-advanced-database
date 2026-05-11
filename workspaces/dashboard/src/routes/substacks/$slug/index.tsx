import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Star,
  UsersRound,
} from 'lucide-react';

import { Button } from '#/components/ui/button';
import { SubstacksIsland } from '#/features/substack/components';
import { substackDetailQueryOptions } from '#/features/substack/queries';
import { TopicCard } from '#/features/topic/components';

export const Route = createFileRoute('/substacks/$slug/')({
  component: SubstackDetailPage,
});

const mockTopics = [
  {
    id: '1',
    title: 'How to handle high-concurrency writes in Drizzle?',
    userId: 'Alex River',
    commentsCount: 12,
    voteScore: 84,
    tags: ['drizzle', 'postgres', 'performance'],
    isSolved: true,
    slug: 'high-concurrency-writes-drizzle',
    createdAt: '2023-10-01T10:00:00Z',
    updatedAt: '2023-10-01T10:00:00Z',
    subscriptionsCount: 10,
  },
  {
    id: '2',
    title: 'Best practices for schema migrations in a monorepo?',
    userId: 'Sam Chen',
    commentsCount: 5,
    voteScore: 31,
    tags: ['migrations', 'turbo', 'dx'],
    isSolved: false,
    slug: 'schema-migrations-monorepo',
    createdAt: '2023-10-02T11:00:00Z',
    updatedAt: '2023-10-02T11:00:00Z',
    subscriptionsCount: 4,
  },
  {
    id: '3',
    title: 'Should we use UUID or ULID for public-facing substack IDs?',
    userId: 'Jordan Lee',
    commentsCount: 18,
    voteScore: 56,
    tags: ['database', 'design', 'security'],
    isSolved: false,
    slug: 'uuid-or-ulid-substack-ids',
    createdAt: '2023-10-03T12:00:00Z',
    updatedAt: '2023-10-03T12:00:00Z',
    subscriptionsCount: 7,
  },
];

const contributors = [
  { name: 'Sarah Drasner', role: 'Maintainer', points: '12.4k' },
  { name: 'Evan You', role: 'Expert', points: '8.2k' },
  { name: 'Dan Abramov', role: 'Contributor', points: '5.1k' },
];

function SubstackDetailPage() {
  const { slug } = Route.useParams();
  const { data: substack } = useSuspenseQuery(
    substackDetailQueryOptions({
      slug,
    }),
  );

  return (
    <div className='grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_280px]'>
      {/* Left Sidebar: Navigation & Context */}
      <aside className='hidden space-y-5 lg:block'>
        <Button
          asChild
          className='w-full justify-start gap-2 border-none bg-transparent px-2 text-sea-ink-soft hover:bg-link-bg-hover hover:text-sea-ink'
          variant='ghost'
        >
          <Link to='/substacks'>
            <ArrowLeft className='size-4' />
            Back to Explore
          </Link>
        </Button>
        <SubstacksIsland />
      </aside>

      {/* Main Content: Community Hub */}
      <main className='min-w-0 space-y-5'>
        {/* Header Island */}
        <section className='island-shell rise-in overflow-hidden rounded-2xl'>
          <div className='h-24 bg-linear-to-r from-lagoon/20 via-lagoon/10 to-transparent' />
          <div className='relative px-6 pb-6'>
            <div className='-mt-8 mb-4 flex items-end justify-between'>
              <div className='flex size-20 items-center justify-center rounded-2xl border-4 border-[#0b1219] bg-lagoon-deep text-3xl font-bold text-white shadow-xl'>
                {substack.name.charAt(0)}
              </div>
              <div className='flex gap-2'>
                <Button
                  className='size-10 rounded-xl border-line bg-white/5'
                  size='icon'
                  variant='outline'
                >
                  <Share2 className='size-4' />
                </Button>
                <Button className='h-10 rounded-xl bg-lagoon-deep px-6 font-bold text-white hover:bg-lagoon-deep/90'>
                  Join Community
                </Button>
              </div>
            </div>

            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <h1 className='display-title m-0 text-3xl font-bold text-sea-ink'>
                  {substack.name}
                </h1>
                <ShieldCheck className='size-5 text-lagoon' />
              </div>
              <p className='island-kicker text-lagoon-deep'>
                s/{substack.slug}
              </p>
            </div>

            {substack.description && (
              <p className='mt-4 max-w-2xl text-base leading-relaxed text-sea-ink-soft'>
                {substack.description}
              </p>
            )}

            <div className='mt-6 flex flex-wrap gap-6 border-t border-line/50 pt-6'>
              <div className='flex items-center gap-2'>
                <UsersRound className='size-5 text-sea-ink-soft' />
                <div>
                  <div className='text-sm font-bold text-sea-ink'>12.4k</div>
                  <div className='text-[10px] font-bold uppercase tracking-wider text-sea-ink-soft'>
                    Members
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Star className='size-5 text-sea-ink-soft' />
                <div>
                  <div className='text-sm font-bold text-sea-ink'>Top 1%</div>
                  <div className='text-[10px] font-bold uppercase tracking-wider text-sea-ink-soft'>
                    Rank
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Search */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex gap-1 rounded-xl border border-line bg-white/5 p-1'>
            {['Active', 'New', 'Solved'].map((f) => (
              <Button
                className='h-8 px-4 text-xs font-bold hover:bg-white/10'
                key={f}
                variant='ghost'
              >
                {f}
              </Button>
            ))}
          </div>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sea-ink-soft' />
            <input
              className='h-10 w-full rounded-xl border border-line bg-chip-bg pl-9 pr-4 text-sm outline-none placeholder:text-sea-ink-soft/50 focus:border-lagoon/50'
              placeholder='Search topics...'
            />
          </div>
          <Button className='h-10 gap-2 rounded-xl bg-white/5 border border-line font-bold text-sea-ink hover:bg-white/10'>
            <Plus className='size-4' />
            Ask Question
          </Button>
        </div>

        {/* Topics Feed */}
        <div className='space-y-3'>
          {mockTopics.map((topic, i) => (
            <TopicCard
              data={topic}
              index={i}
              key={topic.title}
              variant='community'
            />
          ))}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className='space-y-5'>
        <section className='island-shell rise-in rounded-2xl p-5'>
          <p className='island-kicker mb-4'>Top Experts</p>
          <div className='space-y-4'>
            {contributors.map((c) => (
              <div className='flex items-center justify-between' key={c.name}>
                <div className='flex items-center gap-3'>
                  <div className='size-8 rounded-lg bg-white/5 border border-line flex items-center justify-center text-xs font-bold'>
                    {c.name[0]}
                  </div>
                  <div>
                    <div className='text-sm font-bold text-sea-ink'>
                      {c.name}
                    </div>
                    <div className='text-[10px] font-bold text-sea-ink-soft uppercase'>
                      {c.role}
                    </div>
                  </div>
                </div>
                <div className='text-xs font-black text-lagoon-deep bg-lagoon/10 px-2 py-1 rounded-md'>
                  {c.points}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className='island-shell rise-in rounded-2xl border border-lagoon/20 bg-lagoon/5 p-5'>
          <p className='island-kicker mb-2 text-lagoon-deep'>Community Focus</p>
          <p className='text-sm leading-6 text-sea-ink-soft'>
            This month we are focusing on **Database Schema Evolution**.
            Contribute a solved architecture pattern to earn double reputation
            points.
          </p>
          <Button
            className='mt-4 w-full border border-lagoon/30 bg-white/5 font-bold text-lagoon-deep hover:bg-lagoon/10'
            variant='outline'
          >
            View Roadmap
          </Button>
        </section>
      </aside>
    </div>
  );
}
