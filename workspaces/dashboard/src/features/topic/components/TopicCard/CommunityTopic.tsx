import { Link } from '@tanstack/react-router';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

import { authEvents } from '#/components/AuthModal';
import { Button } from '#/components/ui/button';
import { useSession } from '#/features/auth/queries';

import { useRemoveTopicVote, useVoteTopic } from '../../queries';
import type { IBaseTopicCardProps } from './interface';

export function CommunityTopic({ data, index = 0 }: IBaseTopicCardProps) {
  const {
    id,
    title,
    status,
    userId,
    isSolved,
    createdAt,
    voteScore,
    userVote,
    tags = [],
    commentsCount,
  } = data;

  const { data: session } = useSession();
  const voteTopicCommand = useVoteTopic();
  const removeVoteCommand = useRemoveTopicVote();

  const currentUser = session?.user;

  const handleVote = (point: 1 | -1) => {
    if (!currentUser) {
      authEvents.emit('open', {
        message: 'You need to be logged in to vote.',
      });
      return;
    }

    if (userVote === point) {
      removeVoteCommand.mutate(id);
    } else {
      voteTopicCommand.mutate({ id, point });
    }
  };

  const isVotePending =
    voteTopicCommand.isPending || removeVoteCommand.isPending;

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
          className={`size-8 transition-colors ${
            userVote === 1
              ? 'bg-lagoon text-white hover:bg-lagoon-deep'
              : 'text-sea-ink-soft hover:bg-sea-ink/5 hover:text-lagoon'
          }`}
          disabled={isVotePending}
          onClick={() => handleVote(1)}
          size='icon'
          variant='ghost'
        >
          <ChevronUp className='size-5' />
        </Button>

        <span className='text-sm font-black text-sea-ink'>{voteScore}</span>

        <Button
          className={`size-8 transition-colors ${
            userVote === -1
              ? 'bg-destructive text-white hover:bg-destructive/90'
              : 'text-sea-ink-soft hover:bg-sea-ink/5 hover:text-destructive'
          }`}
          disabled={isVotePending}
          onClick={() => handleVote(-1)}
          size='icon'
          variant='ghost'
        >
          <ChevronDown className='size-5' />
        </Button>
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
          <Link params={{ id }} to='/topics/$id'>
            {title}
          </Link>
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
