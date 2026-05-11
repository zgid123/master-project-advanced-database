import { ChevronUp, MessageSquare } from 'lucide-react';

import { Button } from '#/components/ui/button';

import type { IBaseTopicCardProps } from './interface';

export function CommunityTopic({ data, index = 0 }: IBaseTopicCardProps) {
  const {
    title,
    status,
    userId,
    isSolved,
    createdAt,
    voteScore,
    tags = [],
    commentsCount,
  } = data;

  const animationDelay = `${index * 80}ms`;

  return (
    <article
      className='island-shell rise-in flex gap-5 rounded-2xl p-5 transition-colors hover:border-lagoon/30'
      style={{
        animationDelay,
      }}
    >
      <div className='flex flex-col items-center gap-1'>
        <Button
          className='size-8 text-sea-ink-soft hover:text-lagoon'
          size='icon'
          variant='ghost'
        >
          <ChevronUp className='size-5' />
        </Button>
        <span className='text-sm font-black text-sea-ink'>{voteScore}</span>
      </div>
      <div className='flex-1 space-y-2'>
        <div className='flex items-center gap-2'>
          <span className='size-5 rounded bg-sea-ink/10 text-[10px] flex items-center justify-center font-bold text-sea-ink-soft'>
            {userId?.[0] ?? '?'}
          </span>
          <span className='text-xs font-bold text-sea-ink-soft'>{userId}</span>
          <span className='text-[10px] font-bold text-sea-ink-soft/40'>
            • {createdAt ?? 'now'}
          </span>
        </div>
        <h3 className='text-lg font-bold leading-tight text-sea-ink hover:text-lagoon cursor-pointer transition-colors'>
          {title}
        </h3>
        <div className='flex flex-wrap gap-2'>
          {tags.map((tag) => (
            <span
              className='rounded-md bg-chip-bg border border-line px-2 py-0.5 text-[10px] font-bold text-sea-ink-soft uppercase'
              key={tag}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className='hidden flex-col items-end justify-center gap-2 sm:flex'>
        <div className='flex items-center gap-1 text-sea-ink-soft'>
          <MessageSquare className='size-4' />
          <span className='text-xs font-bold'>{commentsCount ?? 0}</span>
        </div>
        {(isSolved || status === 'Answered') && (
          <span className='rounded-full bg-lagoon/20 px-2 py-0.5 text-[9px] font-black uppercase text-lagoon-deep border border-lagoon/30'>
            Solved
          </span>
        )}
      </div>
    </article>
  );
}
