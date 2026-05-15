import { useSuspenseInfiniteQuery } from '@alphacifer/react/query';
import { Loader2 } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { infiniteTopicsQueryOptions } from '#/features/topic/queries';

import { TopicCard } from '../TopicCard';

interface ITopicListProps {
  query?: string;
  substackId?: string;
  variant?: 'feed' | 'community';
}

export function TopicList({
  query,
  substackId,
  variant = 'feed',
}: ITopicListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      infiniteTopicsQueryOptions({
        query,
        substackId,
        limit: 20,
      }),
    );

  const allTopics = data?.pages.flatMap((page) => page.data) ?? [];

  if (allTopics.length === 0) {
    return (
      <div className='island-shell rounded-2xl p-10 text-center'>
        <p className='text-sea-ink-soft'>No topics found.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-3'>
        {allTopics.map((topic, index) => (
          <TopicCard
            data={topic}
            index={index}
            key={topic.id}
            variant={variant}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className='flex justify-center pt-4'>
          <Button
            className='h-11 min-w-40 border border-lagoon/35 bg-lagoon/10 font-bold text-lagoon-deep hover:bg-lagoon/18'
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant='outline'
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
