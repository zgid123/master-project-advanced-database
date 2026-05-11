import type { TSubstackEntity } from '@domain/auth';
import { ArrowRight, UsersRound } from 'lucide-react';

import { Button } from '#/components/ui/button';

export interface ISubstackCardProps {
  index?: number;
  data: TSubstackEntity & {
    topics: number;
    members: string;
  };
}

export function SubstackCard({ data, index = 0 }: ISubstackCardProps) {
  const { name, description, members, topics } = data;

  return (
    <article
      className='island-shell rise-in flex flex-col overflow-hidden rounded-2xl border border-line transition-all hover:border-lagoon/40'
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className='flex flex-1 flex-col p-6'>
        <div className='mb-4 flex items-start justify-between'>
          <div className='flex items-center gap-1.5 text-xs font-bold text-sea-ink-soft'>
            <UsersRound className='size-4' />
            {members}
          </div>
        </div>

        <h3 className='mb-2 text-xl font-bold text-sea-ink'>{name}</h3>
        <div className='mb-4 flex flex-wrap gap-2'>
          <span className='rounded-md border border-line bg-chip-bg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sea-ink-soft'>
            Community
          </span>
        </div>
        <p className='mb-6 flex-1 text-sm leading-relaxed text-sea-ink-soft'>
          {description}
        </p>

        <div className='mt-auto flex items-center justify-between border-t border-line/50 pt-4'>
          <span className='text-xs font-bold uppercase tracking-wider text-lagoon-deep'>
            {topics} Topics
          </span>
          <Button
            className='group h-8 gap-1.5 px-0 text-sm font-bold text-sea-ink hover:bg-transparent hover:text-lagoon-deep'
            variant='ghost'
          >
            View{' '}
            <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
          </Button>
        </div>
      </div>
    </article>
  );
}
