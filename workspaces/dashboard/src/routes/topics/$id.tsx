import { useSuspenseQuery } from '@alphacifer/react/query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  MessageSquare,
  Bell,
  BellOff,
} from 'lucide-react';
import { Suspense } from 'react';

import { authEvents } from '#/components/AuthModal';
import { Button } from '#/components/ui/button';
import { useSession } from '#/features/auth/queries';
import {
  CommentForm,
  CommentList,
  CommentListSkeleton,
} from '#/features/comment/components';
import {
  topicDetailQueryOptions,
  useRemoveTopicVote,
  useSubscribeTopic,
  useUnsubscribeTopic,
  useVoteTopic,
} from '#/features/topic/queries';

export const Route = createFileRoute('/topics/$id')({
  component: TopicDetailRoute,
});

function TopicDetailRoute() {
  const { id: topicId } = Route.useParams();
  const { data: session } = useSession();
  const { data: topic } = useSuspenseQuery(topicDetailQueryOptions(topicId));
  const voteTopicCommand = useVoteTopic();
  const removeVoteCommand = useRemoveTopicVote();
  const subscribeTopicCommand = useSubscribeTopic();
  const unsubscribeTopicCommand = useUnsubscribeTopic();

  const currentUser = session?.user;

  const handleVote = (point: 1 | -1) => {
    if (!currentUser) {
      authEvents.emit('open', {
        message: 'You need to be logged in to vote.',
      });
      return;
    }

    if (topic.userVote === point) {
      removeVoteCommand.mutate(topicId);
    } else {
      voteTopicCommand.mutate({ id: topicId, point });
    }
  };

  const handleSubscribe = () => {
    if (!currentUser) {
      authEvents.emit('open', {
        message: 'You need to be logged in to subscribe.',
      });
      return;
    }

    if (topic.isSubscribed) {
      unsubscribeTopicCommand.mutate(topicId);
    } else {
      subscribeTopicCommand.mutate(topicId);
    }
  };

  const isVotePending = voteTopicCommand.isPending || removeVoteCommand.isPending;
  const isSubscribePending = subscribeTopicCommand.isPending || unsubscribeTopicCommand.isPending;

  return (
    <div className='mx-auto max-w-5xl space-y-8 pb-20'>
      <header className='flex items-center justify-between'>
        <Button
          asChild
          className='gap-2 border-none bg-transparent px-2 text-sea-ink-soft hover:bg-link-bg-hover hover:text-sea-ink'
          variant='ghost'
        >
          <Link to='/topics'>
            <ArrowLeft className='size-4' />
            Back to Topics
          </Link>
        </Button>
      </header>

      <main className='grid gap-6 lg:grid-cols-[1fr_300px]'>
        <div className='space-y-6'>
          <article className='island-shell rise-in rounded-3xl p-8 shadow-sm'>
            <div className='mb-6 flex flex-wrap items-center gap-3'>
              {topic.substackId && (
                <span className='rounded-full border border-lagoon/24 bg-lagoon/12 px-3 py-1 text-xs font-bold text-lagoon-deep'>
                  {topic.substackId}
                </span>
              )}
              {topic.isSolved && (
                <span className='flex items-center gap-1.5 rounded-full border border-emerald-500/24 bg-emerald-500/12 px-3 py-1 text-xs font-bold text-emerald-600'>
                  <CheckCircle2 className='size-3.5' />
                  Solved
                </span>
              )}
            </div>

            <h1 className='mb-4 text-3xl font-black leading-tight text-sea-ink md:text-4xl'>
              {topic.title}
            </h1>

            <div className='mb-8 flex flex-wrap items-center gap-6 text-sm text-sea-ink-soft/70'>
              <div className='flex items-center gap-2'>
                <div className='flex size-6 items-center justify-center rounded-full bg-sea-ink/10 text-[10px] font-bold'>
                  {topic.userId?.[0] ?? '?'}
                </div>
                <span className='font-bold text-sea-ink-soft'>
                  {topic.userId}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Calendar className='size-4' />
                <span>
                  {topic.createdAt
                    ? new Date(topic.createdAt).toLocaleDateString()
                    : 'Recently'}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Eye className='size-4' />
                <span>{topic.views ?? 0} views</span>
              </div>
            </div>

            <div className='prose prose-slate max-w-none border-t border-line pt-8'>
              <p className='whitespace-pre-wrap text-lg leading-relaxed text-sea-ink/90'>
                {topic.body || 'No description provided.'}
              </p>
            </div>

            <div className='mt-10 flex flex-wrap gap-2'>
              {topic.tags?.map((tag) => (
                <span
                  className='rounded-lg border border-line bg-chip-bg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-sea-ink-soft'
                  key={tag}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </article>

          <section className='space-y-6 pt-4'>
            <div className='flex items-center justify-between'>
              <h2 className='flex items-center gap-3 text-2xl font-bold text-sea-ink'>
                <MessageSquare className='size-6 text-lagoon' />
                Comments
                <span className='rounded-full bg-sea-ink/5 px-2.5 py-0.5 text-sm font-bold text-sea-ink-soft'>
                  {topic.commentsCount ?? 0}
                </span>
              </h2>
            </div>

            <Suspense fallback={<CommentListSkeleton />}>
              <CommentList topicId={topicId} />
            </Suspense>

            <div className='island-shell rounded-2xl p-6'>
              <h3 className='mb-4 font-bold text-sea-ink'>Add a comment</h3>
              <TopicCommentForm topicId={topicId} />
            </div>
          </section>
        </div>

        <aside className='space-y-6'>
          <div className='island-shell sticky top-6 space-y-6 rounded-3xl p-6'>
            <div className='space-y-2'>
              <p className='island-kicker'>Topic Stats</p>
              <div className='grid grid-cols-2 gap-4 pt-2'>
                <div className='rounded-2xl bg-sea-ink/5 p-4 text-center'>
                  <div className='text-2xl font-black text-sea-ink'>
                    {topic.voteScore ?? 0}
                  </div>
                  <div className='text-[10px] font-bold uppercase tracking-widest text-sea-ink-soft'>
                    Votes
                  </div>
                </div>
                <div className='rounded-2xl bg-sea-ink/5 p-4 text-center'>
                  <div className='text-2xl font-black text-sea-ink'>
                    {topic.commentsCount ?? 0}
                  </div>
                  <div className='text-[10px] font-bold uppercase tracking-widest text-sea-ink-soft'>
                    Answers
                  </div>
                </div>
              </div>
            </div>

            <div className='flex gap-2'>
              <div className='flex flex-1 items-center rounded-xl bg-sea-ink/5 p-1'>
                <Button
                  className={`flex-1 h-10 gap-2 rounded-lg font-bold shadow-none ${
                    topic.userVote === 1
                      ? 'bg-lagoon text-white hover:bg-lagoon-deep'
                      : 'bg-transparent text-sea-ink-soft hover:bg-sea-ink/5 hover:text-sea-ink'
                  }`}
                  disabled={isVotePending}
                  onClick={() => handleVote(1)}
                  type='button'
                  variant='ghost'
                >
                  <ChevronUp className='size-5' />
                  Upvote
                </Button>
                <div className='w-px h-4 bg-line/50' />
                <Button
                  className={`flex-1 h-10 gap-2 rounded-lg font-bold shadow-none ${
                    topic.userVote === -1
                      ? 'bg-destructive text-white hover:bg-destructive/90'
                      : 'bg-transparent text-sea-ink-soft hover:bg-sea-ink/5 hover:text-sea-ink'
                  }`}
                  disabled={isVotePending}
                  onClick={() => handleVote(-1)}
                  type='button'
                  variant='ghost'
                >
                  <ChevronDown className='size-5' />
                  Downvote
                </Button>
              </div>
            </div>

            <Button
              className={`w-full h-12 gap-2 rounded-xl font-bold shadow-lg shadow-lagoon/20 ${
                topic.isSubscribed
                  ? 'bg-sea-ink/5 text-sea-ink-soft hover:bg-sea-ink/10 shadow-none'
                  : 'bg-lagoon text-white hover:bg-lagoon-deep'
              }`}
              disabled={isSubscribePending}
              onClick={handleSubscribe}
              type='button'
            >
              {topic.isSubscribed ? (
                <>
                  <BellOff className='size-4' />
                  Unsubscribe
                </>
              ) : (
                <>
                  <Bell className='size-4' />
                  Subscribe
                </>
              )}
            </Button>

            <div className='border-t border-line pt-6 space-y-4'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-sea-ink-soft font-medium'>
                  Subscribers
                </span>
                <span className='font-bold text-sea-ink'>
                  {topic.subscriptionsCount ?? 0}
                </span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-sea-ink-soft font-medium'>Topic ID</span>
                <span className='font-mono text-[10px] text-sea-ink-soft/50'>
                  {topicId.slice(-8)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function TopicCommentForm({ topicId }: { topicId: string }) {
  return <CommentForm topicId={topicId} />;
}
