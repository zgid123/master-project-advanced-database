import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus, UsersRound } from 'lucide-react';
import { useState } from 'react';

import { Button } from '#/components/ui/button';
import { useSession } from '#/features/auth/queries/authQueries';
import {
  substackListQueryOptions,
  totalSubstacksQueryOptions,
} from '#/features/substack/queries';
import { cn } from '#/shared/utils';

import { SubstackFormModal } from '../SubstackForm';

const tones = [
  'bg-lagoon/18 text-lagoon-deep border-lagoon/28',
  'bg-[#f59e0b]/14 text-[#f7c46b] border-[#f59e0b]/24',
  'bg-[#8b5cf6]/14 text-[#c4b5fd] border-[#8b5cf6]/24',
  'bg-[#f43f5e]/12 text-[#fda4af] border-[#f43f5e]/20',
  'bg-[#22c55e]/12 text-[#86efac] border-[#22c55e]/22',
  'bg-[#38bdf8]/12 text-[#7dd3fc] border-[#38bdf8]/22',
  'bg-[#84cc16]/12 text-[#bef264] border-[#84cc16]/22',
  'bg-[#ec4899]/12 text-[#f9a8d4] border-[#ec4899]/22',
];

export function SubstacksIsland() {
  const { data: substacks } = useSuspenseQuery(
    substackListQueryOptions({
      limit: 8,
    }),
  );
  const {
    data: { totalSubstacks },
  } = useSuspenseQuery(totalSubstacksQueryOptions());
  const { data: session, isPending } = useSession();
  const currentUser = session?.user;
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isPending) {
    return null;
  }

  return (
    <aside className='island-shell rise-in h-fit rounded-2xl p-4'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div>
          <p className='island-kicker mb-1'>Substacks</p>
          <h1 className='m-0 text-lg font-bold text-sea-ink'>Communities</h1>
        </div>
        {currentUser && (
          <Button
            aria-label='Create substack'
            className='size-9 border border-lagoon/30 bg-lagoon/14 text-lagoon-deep hover:bg-lagoon/22'
            onClick={() => setIsCreateOpen(true)}
            size='icon'
            variant='secondary'
          >
            <Plus className='size-4' />
          </Button>
        )}
      </div>
      <div className='space-y-2'>
        {substacks.map((substack, index) => {
          return (
            <Button
              asChild
              className='flex h-auto w-full items-start justify-between gap-3 rounded-xl border border-transparent px-3 py-3 text-left hover:border-line hover:bg-white/5'
              key={substack.id}
              variant='ghost'
            >
              <Link
                params={{
                  slug: substack.slug,
                }}
                to='/substacks/$slug'
              >
                <span className='flex flex-1 flex-col gap-1'>
                  <span className='block whitespace-normal text-sm font-semibold leading-tight text-sea-ink'>
                    {substack.name}
                  </span>
                  <span className='flex items-center gap-1.5 text-xs text-sea-ink-soft'>
                    <UsersRound className='size-3.5 shrink-0' />
                    {(substack.name.length * 1.2).toFixed(1)}k
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold',
                    tones[index % tones.length],
                  )}
                >
                  {substack.name.length}
                </span>
              </Link>
            </Button>
          );
        })}
      </div>
      <Button asChild className='mt-4 h-10 w-full' variant='outline'>
        <Link to='/substacks'>View all {totalSubstacks} substacks</Link>
      </Button>
      <SubstackFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => setIsCreateOpen(false)}
      />
    </aside>
  );
}
