import { ArrowBigDown, ArrowBigUp, Bookmark, BookmarkCheck } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { Button } from '#/components/ui/button';
import { TopicCard } from '#/features/topic/components';
import type { ITopicPreview } from '#/features/topic/interface';

import type { TTopic } from '../types';

export function TopicListItem({
  topic,
  isAuthed,
  onVote,
  onSubscribe,
  onUnsubscribe,
}: {
  topic: TTopic;
  isAuthed: boolean;
  onVote: (point: 1 | -1) => void;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
}) {
  const data: ITopicPreview = {
    id: topic.id,
    title: topic.title,
    body: topic.body,
    slug: topic.slug,
    isSolved: topic.isSolved,
    userId: topic.userId,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
    voteScore: topic.voteScore,
    commentsCount: topic.commentsCount,
    subscriptionsCount: topic.subscriptionsCount,
    hasAcceptedAnswer: topic.hasAcceptedAnswer,
    isSubscribed: topic.isSubscribed,
    substackId: topic.substackId,
  };

  return (
    <div className='space-y-3'>
      <Link className='block' to='/topics/$id' params={{ id: topic.id }}>
        <TopicCard data={data} variant='community' />
      </Link>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          size='icon-xs'
          variant='outline'
          onClick={() => onVote(1)}
          disabled={!isAuthed}
        >
          <ArrowBigUp className='size-3.5' />
        </Button>
        <Button
          size='icon-xs'
          variant='outline'
          onClick={() => onVote(-1)}
          disabled={!isAuthed}
        >
          <ArrowBigDown className='size-3.5' />
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={topic.isSubscribed ? onUnsubscribe : onSubscribe}
          disabled={!isAuthed}
        >
          {topic.isSubscribed ? (
            <>
              <BookmarkCheck className='size-4' />
              Subscribed
            </>
          ) : (
            <>
              <Bookmark className='size-4' />
              Subscribe
            </>
          )}
        </Button>
        <span className='text-xs font-semibold text-sea-ink-soft'>
          {topic.commentsCount} answers
        </span>
      </div>
    </div>
  );
}
