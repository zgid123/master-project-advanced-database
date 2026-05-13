import { useMemo, useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import {
  ArrowBigDown,
  ArrowBigUp,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react';

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
  acceptComment,
  createComment,
  deleteComment,
  deleteTopic,
  solveTopic,
  subscribeTopic,
  unsubscribeTopic,
  updateComment,
  updateTopic,
  voteComment,
  voteTopic,
} from '../api';
import { CommentForm, CommentListSkeleton, TopicForm } from '../components';
import {
  commentsQueryOptions,
  QNA_QUERY_KEYS,
  topicDetailQueryOptions,
} from '../queries';
import type { TComment } from '../types';

export function TopicDetailPage({ topicId }: { topicId: string }) {
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const currentUser = session?.user;
  const isAuthed = Boolean(currentUser);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<TComment | null>(null);

  const { data: topic } = useSuspenseQuery(topicDetailQueryOptions(topicId));
  const { data: comments } = useSuspenseQuery(commentsQueryOptions(topicId));

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (a.isAccepted === b.isAccepted) {
        return b.voteScore - a.voteScore;
      }
      return a.isAccepted ? -1 : 1;
    });
  }, [comments]);

  const handleAuthRequired = () => {
    authEvents.emit('open', {
      message: 'You need to be logged in to take this action.',
    });
  };

  const invalidateTopic = () => {
    queryClient.invalidateQueries({
      queryKey: [QNA_QUERY_KEYS.topic, { id: topicId }],
    });
    queryClient.invalidateQueries({ queryKey: [QNA_QUERY_KEYS.topics] });
  };

  const invalidateComments = () => {
    queryClient.invalidateQueries({
      queryKey: [QNA_QUERY_KEYS.comments, { topicId }],
    });
  };

  const voteTopicMutation = useMutation({
    mutationFn: voteTopic,
    onSuccess: invalidateTopic,
  });

  const subscribeMutation = useMutation({
    mutationFn: subscribeTopic,
    onSuccess: invalidateTopic,
  });

  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribeTopic,
    onSuccess: invalidateTopic,
  });

  const updateTopicMutation = useMutation({
    mutationFn: updateTopic,
    onSuccess: () => {
      setIsEditOpen(false);
      invalidateTopic();
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: deleteTopic,
  });

  const solveTopicMutation = useMutation({
    mutationFn: solveTopic,
    onSuccess: invalidateTopic,
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      invalidateComments();
      invalidateTopic();
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: updateComment,
    onSuccess: () => {
      setEditingComment(null);
      invalidateComments();
      invalidateTopic();
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      invalidateComments();
      invalidateTopic();
    },
  });

  const voteCommentMutation = useMutation({
    mutationFn: voteComment,
    onSuccess: invalidateComments,
  });

  const acceptCommentMutation = useMutation({
    mutationFn: acceptComment,
    onSuccess: () => {
      invalidateComments();
      invalidateTopic();
    },
  });

  if (isPending) {
    return <CommentListSkeleton />;
  }

  const canManageTopic = currentUser?.id === topic.userId;

  return (
    <section className='space-y-6'>
      <header className='space-y-4 rounded-2xl border border-line bg-white/5 p-6'>
        <div className='flex flex-col gap-2'>
          <div className='flex flex-wrap items-center gap-2 text-xs font-semibold text-sea-ink-soft'>
            <span>Asked by {topic.userId}</span>
            <span>•</span>
            <span>{topic.createdAt}</span>
            {topic.isSolved && (
              <span className='inline-flex items-center gap-1 rounded-full border border-lagoon/30 bg-lagoon/15 px-2 py-0.5 text-[10px] font-bold text-lagoon-deep'>
                <CheckCircle2 className='size-3' />
                Solved
              </span>
            )}
          </div>
          <h1 className='m-0 text-3xl font-bold text-sea-ink'>
            {topic.title}
          </h1>
          {topic.body && (
            <p className='text-sm leading-6 text-sea-ink-soft'>{topic.body}</p>
          )}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            size='icon-xs'
            variant='outline'
            onClick={() => {
              if (!isAuthed) {
                handleAuthRequired();
                return;
              }
              voteTopicMutation.mutate({ id: topic.id, point: 1 });
            }}
          >
            <ArrowBigUp className='size-3.5' />
          </Button>
          <Button
            size='icon-xs'
            variant='outline'
            onClick={() => {
              if (!isAuthed) {
                handleAuthRequired();
                return;
              }
              voteTopicMutation.mutate({ id: topic.id, point: -1 });
            }}
          >
            <ArrowBigDown className='size-3.5' />
          </Button>
          <span className='text-sm font-semibold text-sea-ink-soft'>
            {topic.voteScore} votes
          </span>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              if (!isAuthed) {
                handleAuthRequired();
                return;
              }
              if (topic.isSubscribed) {
                unsubscribeMutation.mutate(topic.id);
              } else {
                subscribeMutation.mutate(topic.id);
              }
            }}
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
          {canManageTopic && !topic.isSolved && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => solveTopicMutation.mutate(topic.id)}
            >
              Mark solved
            </Button>
          )}
          {canManageTopic && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => setIsEditOpen(true)}
            >
              <Pencil className='size-4' />
              Edit
            </Button>
          )}
          {canManageTopic && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                if (deleteTopicMutation.isPending) return;
                if (!confirm('Delete this topic? This cannot be undone.')) return;
                deleteTopicMutation.mutate(topic.id, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({
                      queryKey: [QNA_QUERY_KEYS.topics],
                    });
                    window.location.href = '/topics';
                  },
                });
              }}
            >
              <Trash2 className='size-4' />
              Delete
            </Button>
          )}
        </div>
      </header>

      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='m-0 text-xl font-bold text-sea-ink'>Answers</h2>
          <span className='text-xs font-semibold text-sea-ink-soft'>
            {comments.length} responses
          </span>
        </div>
        {sortedComments.length === 0 ?
          (
            <div className='rounded-xl border border-dashed border-line bg-white/5 p-6 text-center text-sm text-sea-ink-soft'>
              No answers yet. Share the first response.
            </div>
          )
        : (
            <div className='space-y-4'>
              {sortedComments.map((comment) => {
                const isOwner = currentUser?.id === comment.userId;
                const canAccept = canManageTopic && !comment.isAccepted;
                return (
                  <article
                    className='rounded-2xl border border-line bg-white/5 p-5'
                    key={comment.id}
                  >
                    <div className='flex flex-wrap items-start justify-between gap-4'>
                      <div>
                        <div className='flex items-center gap-2 text-xs font-semibold text-sea-ink-soft'>
                          <span>{comment.userId}</span>
                          <span>•</span>
                          <span>{comment.createdAt}</span>
                          {comment.isAccepted && (
                            <span className='inline-flex items-center gap-1 rounded-full border border-lagoon/30 bg-lagoon/15 px-2 py-0.5 text-[10px] font-bold text-lagoon-deep'>
                              <CheckCircle2 className='size-3' />
                              Accepted
                            </span>
                          )}
                        </div>
                        <p className='mt-3 text-sm leading-6 text-sea-ink'>
                          {comment.content}
                        </p>
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Button
                          size='icon-xs'
                          variant='outline'
                          onClick={() => {
                            if (!isAuthed) {
                              handleAuthRequired();
                              return;
                            }
                            voteCommentMutation.mutate({
                              id: comment.id,
                              point: 1,
                            });
                          }}
                        >
                          <ArrowBigUp className='size-3.5' />
                        </Button>
                        <Button
                          size='icon-xs'
                          variant='outline'
                          onClick={() => {
                            if (!isAuthed) {
                              handleAuthRequired();
                              return;
                            }
                            voteCommentMutation.mutate({
                              id: comment.id,
                              point: -1,
                            });
                          }}
                        >
                          <ArrowBigDown className='size-3.5' />
                        </Button>
                        <span className='text-xs font-semibold text-sea-ink-soft'>
                          {comment.voteScore} votes
                        </span>
                        {canAccept && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              if (!isAuthed) {
                                handleAuthRequired();
                                return;
                              }
                              acceptCommentMutation.mutate({
                                commentId: comment.id,
                                topicId,
                              });
                            }}
                          >
                            Accept
                          </Button>
                        )}
                        {isOwner && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setEditingComment(comment)}
                          >
                            <Pencil className='size-4' />
                            Edit
                          </Button>
                        )}
                        {isOwner && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              if (!confirm('Delete this answer?')) return;
                              deleteCommentMutation.mutate(comment.id);
                            }}
                          >
                            <Trash2 className='size-4' />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </section>

      <section className='space-y-3 rounded-2xl border border-line bg-white/5 p-6'>
        <h3 className='m-0 text-lg font-bold text-sea-ink'>Add an answer</h3>
        <CommentForm
          submitLabel='Post answer'
          isSubmitting={createCommentMutation.isPending}
          onSubmit={(content) => {
            if (!isAuthed) {
              handleAuthRequired();
              return;
            }
            createCommentMutation.mutate({ topicId, content });
          }}
        />
      </section>

      <Dialog onOpenChange={(open) => !open && setIsEditOpen(false)} open={isEditOpen}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>Edit topic</DialogTitle>
          </DialogHeader>
          <TopicForm
            initialTitle={topic.title}
            initialBody={topic.body ?? ''}
            initialSubstackId={topic.substackId ?? ''}
            submitLabel='Save changes'
            isSubmitting={updateTopicMutation.isPending}
            onSubmit={(formData) => {
              updateTopicMutation.mutate({
                id: topic.id,
                title: formData.title,
                body: formData.body,
              });
            }}
            onCancel={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setEditingComment(null);
        }}
        open={Boolean(editingComment)}
      >
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>Edit answer</DialogTitle>
          </DialogHeader>
          {editingComment && (
            <CommentForm
              initialContent={editingComment.content}
              submitLabel='Save answer'
              isSubmitting={updateCommentMutation.isPending}
              onSubmit={(content) => {
                updateCommentMutation.mutate({
                  id: editingComment.id,
                  content,
                });
              }}
              onCancel={() => setEditingComment(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
