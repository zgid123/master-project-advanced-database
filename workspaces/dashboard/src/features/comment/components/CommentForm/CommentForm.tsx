import { Loader2 } from 'lucide-react';
import type * as React from 'react';

import { authEvents } from '#/components/AuthModal';
import { Button } from '#/components/ui/button';
import { Textarea } from '#/components/ui/textarea';
import { useSession } from '#/features/auth/queries';

import { useCreateComment, useUpdateComment } from '../../queries';
import type { TComment } from '../../types';
import { commentFormOptions, useAppForm } from './hooks';

export function CommentForm({
  topicId,
  comment,
  onSuccess,
  onCancel,
}: {
  topicId: string;
  comment?: TComment;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const { data: session } = useSession();
  const createCommentCommand = useCreateComment(topicId);
  const updateCommentCommand = useUpdateComment(topicId);

  const currentUser = session?.user;

  const form = useAppForm({
    ...commentFormOptions,
    defaultValues: {
      content: comment?.content ?? '',
    },
    onSubmit: async ({ value }) => {
      try {
        if (comment) {
          await updateCommentCommand.mutateAsync({
            id: comment.id,
            content: value.content,
          });
        } else {
          await createCommentCommand.mutateAsync({
            topicId,
            content: value.content,
          });
        }
        onSuccess?.();
        form.reset();
      } catch {
        // Error rendered below
      }
    },
  });

  const isPending =
    form.state.isSubmitting ||
    createCommentCommand.isPending ||
    updateCommentCommand.isPending;

  return (
    <form
      className='flex flex-col gap-4'
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!currentUser) {
          authEvents.emit('open', {
            message: 'You need to be logged in to post a comment.',
          });
          return;
        }

        form.handleSubmit();
      }}
    >
      <form.Field name='content'>
        {(field) => (
          <div className='flex flex-col gap-2'>
            <Textarea
              className='min-h-32'
              id='comment-content'
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                field.handleChange(e.target.value)
              }
              placeholder='Share your answer or comment...'
              value={field.state.value}
            />
            {field.state.meta.errors.length > 0 && (
              <p className='m-0 text-sm font-medium text-destructive'>
                {String(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <div className='m-0 min-h-5 text-sm font-medium text-destructive'>
        {form.state.errors.length > 0
          ? String(form.state.errors[0])
          : comment
            ? updateCommentCommand.error?.message || ''
            : createCommentCommand.error?.message || ''}
      </div>

      <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
        {onCancel && (
          <Button
            disabled={isPending}
            onClick={onCancel}
            type='button'
            variant='outline'
          >
            Cancel
          </Button>
        )}
        <Button disabled={isPending} type='submit'>
          {isPending ? (
            <>
              <Loader2 className='mr-2 size-4 animate-spin' />
              {comment ? 'Updating...' : 'Posting...'}
            </>
          ) : comment ? (
            'Update Comment'
          ) : (
            'Post Comment'
          )}
        </Button>
      </div>
    </form>
  );
}
