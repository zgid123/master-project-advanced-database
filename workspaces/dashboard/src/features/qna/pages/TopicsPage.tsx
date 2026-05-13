import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';

import { authEvents } from '#/components/AuthModal';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { useSession } from '#/features/auth/queries';

import {
  createTopic,
  subscribeTopic,
  unsubscribeTopic,
  voteTopic,
} from '../api';
import {
  Pagination,
  TopicForm,
  TopicListItem,
  TopicListSkeleton,
} from '../components';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { QNA_QUERY_KEYS, topicsQueryOptions } from '../queries';

const PAGE_SIZE = 10;

export function TopicsPage() {
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const currentUser = session?.user;
  const isAuthed = Boolean(currentUser);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const topicQueryOptions = useMemo(
    () =>
      topicsQueryOptions({
        query: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    [debouncedSearch, page],
  );

  const { data } = useSuspenseQuery(topicQueryOptions);

  const createTopicMutation = useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: [QNA_QUERY_KEYS.topics] });
    },
  });

  const voteMutation = useMutation({
    mutationFn: voteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QNA_QUERY_KEYS.topics] });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: subscribeTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QNA_QUERY_KEYS.topics] });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribeTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QNA_QUERY_KEYS.topics] });
    },
  });

  if (isPending) {
    return <TopicListSkeleton />;
  }

  const handleAuthRequired = () => {
    authEvents.emit('open', {
      message: 'You need to be logged in to manage Q&A topics.',
    });
  };

  return (
    <section className='space-y-6'>
      <header className='flex flex-col gap-4 rounded-2xl border border-line bg-white/5 p-6 shadow-sm'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='island-kicker'>Community Q&A</p>
            <h1 className='m-0 text-3xl font-bold text-sea-ink sm:text-4xl'>
              Questions
            </h1>
            <p className='mt-2 text-sm text-sea-ink-soft'>
              Ask, vote, and follow answers from the community.
            </p>
          </div>
          <Button
            className='h-11 rounded-xl border border-lagoon/35 bg-lagoon/16 px-4 font-bold text-lagoon-deep hover:bg-lagoon/24'
            onClick={() => {
              if (!isAuthed) {
                handleAuthRequired();
                return;
              }
              setIsCreateOpen(true);
            }}
            type='button'
            variant='secondary'
          >
            <Plus className='size-4' />
            Ask question
          </Button>
        </div>
        <div className='flex flex-col gap-3 md:flex-row md:items-center'>
          <label className='flex h-11 flex-1 items-center gap-3 rounded-xl border border-line bg-chip-bg px-3 text-sea-ink-soft'>
            <Search className='size-4 shrink-0' />
            <input
              className='min-w-0 flex-1 bg-transparent text-sm text-sea-ink outline-none placeholder:text-sea-ink-soft/70'
              placeholder='Search topics by title or summary'
              type='search'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className='flex items-center justify-between gap-3 text-xs font-semibold text-sea-ink-soft md:justify-end'>
            <span>
              {data.pagination.total} topics · Page {data.pagination.page}
            </span>
          </div>
        </div>
      </header>

      <Dialog onOpenChange={setIsCreateOpen} open={isCreateOpen}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>Ask a new question</DialogTitle>
          </DialogHeader>
          <TopicForm
            submitLabel='Publish question'
            isSubmitting={createTopicMutation.isPending}
            onSubmit={(formData) => {
              createTopicMutation.mutate(formData);
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {data.data.length === 0 ?
        (
          <div className='rounded-2xl border border-dashed border-line bg-white/5 p-8 text-center text-sm text-sea-ink-soft'>
            No questions yet. Be the first to ask!
          </div>
        )
      : (
          <div className='space-y-4'>
            {data.data.map((topic) => (
              <TopicListItem
                isAuthed={isAuthed}
                key={topic.id}
                topic={topic}
                onVote={(point) => {
                  if (!isAuthed) {
                    handleAuthRequired();
                    return;
                  }
                  voteMutation.mutate({ id: topic.id, point });
                }}
                onSubscribe={() => {
                  if (!isAuthed) {
                    handleAuthRequired();
                    return;
                  }
                  subscribeMutation.mutate(topic.id);
                }}
                onUnsubscribe={() => {
                  if (!isAuthed) {
                    handleAuthRequired();
                    return;
                  }
                  unsubscribeMutation.mutate(topic.id);
                }}
              />
            ))}
          </div>
        )}

      <Pagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        onPageChange={setPage}
        isLoading={voteMutation.isPending}
      />
    </section>
  );
}
