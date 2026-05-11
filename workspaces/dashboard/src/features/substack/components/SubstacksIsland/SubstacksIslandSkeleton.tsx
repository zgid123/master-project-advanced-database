import { Plus } from 'lucide-react';

import { Button } from '#/components/ui/button';

export function SubstacksIslandSkeleton() {
  return (
    <aside className='island-shell h-fit rounded-2xl p-4'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div>
          <div className='h-3 w-16 animate-pulse rounded bg-line/20 mb-2' />
          <div className='h-5 w-32 animate-pulse rounded bg-line/20' />
        </div>
        <Button
          aria-label='Create substack'
          className='size-9 border border-lagoon/30 bg-lagoon/14 text-lagoon-deep hover:bg-lagoon/22'
          disabled
          size='icon'
          variant='secondary'
        >
          <Plus className='size-4' />
        </Button>
      </div>
      <div className='space-y-2'>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            className='flex h-auto w-full items-start justify-between gap-3 rounded-xl border border-transparent px-3 py-3'
            key={i}
          >
            <div className='flex flex-1 flex-col gap-1'>
              <div className='h-4 w-24 animate-pulse rounded bg-line/20' />
              <div className='h-3 w-16 animate-pulse rounded bg-line/20' />
            </div>
            <div className='h-5 w-8 animate-pulse rounded-full bg-line/20 shrink-0' />
          </div>
        ))}
      </div>
      <div className='mt-4 h-10 w-full animate-pulse rounded-xl bg-line/20' />
    </aside>
  );
}
