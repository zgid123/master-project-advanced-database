import { Link } from '@tanstack/react-router';

import type { IBaseTopicCardProps } from './interface';
import { Metric } from './Metric';

export function FeedTopic({ data, index = 0 }: IBaseTopicCardProps) {
  const {
    id,
    body,
    title,
    status,
    tags = [],
    views = 0,
    voteScore,
    substackId,
    commentsCount,
  } = data;

  const animationDelay = `${index * 80}ms`;

  return (
    <article
      className='feature-card rise-in grid gap-4 rounded-2xl p-4 md:grid-cols-[88px_minmax(0,1fr)]'
      style={{
        animationDelay,
      }}
    >
      <div className='grid grid-cols-3 gap-2 text-center md:grid-cols-1'>
        <Metric label='votes' value={voteScore} />
        <Metric label='answers' strong value={commentsCount ?? 0} />
        <Metric label='views' value={views ?? 0} />
      </div>
      <div className='min-w-0'>
        <div className='mb-2 flex flex-wrap items-center gap-2'>
          {substackId && (
            <span className='rounded-full border border-lagoon/24 bg-lagoon/12 px-2.5 py-1 text-xs font-bold text-lagoon-deep'>
              {substackId}
            </span>
          )}
          {status && (
            <span className='rounded-full border border-[#f59e0b]/24 bg-[#f59e0b]/12 px-2.5 py-1 text-xs font-bold text-[#f7c46b]'>
              {status}
            </span>
          )}
        </div>
        <h3 className='m-0 text-lg font-bold leading-snug text-sea-ink hover:text-lagoon cursor-pointer transition-colors'>
          <Link params={{ id }} to='/topics/$id'>
            {title}
          </Link>
        </h3>
        <p className='my-2 text-sm leading-6 text-sea-ink-soft'>{body}</p>
        <div className='flex flex-wrap gap-2'>
          {tags.map((tag) => (
            <span
              className='rounded-md border border-line bg-chip-bg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sea-ink-soft'
              key={tag}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
