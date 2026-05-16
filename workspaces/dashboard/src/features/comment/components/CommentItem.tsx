import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { authEvents } from '#/components/AuthModal';
import { Button } from '#/components/ui/button';
import { useSession } from '#/features/auth/queries';

import { useRemoveCommentVote, useVoteComment } from '../queries';
import type { TComment } from '../types';
import { CommentForm } from './CommentForm';

export function CommentItem({ comment }: { comment: TComment }) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const voteCommentCommand = useVoteComment(comment.topicId);
  const removeVoteCommand = useRemoveCommentVote(comment.topicId);

  const currentUser = session?.user;
  const isOwner = currentUser?.id === comment.userId;

  const handleVote = (point: 1 | -1) => {
    if (!currentUser) {
      authEvents.emit('open', {
        message: 'You need to be logged in to vote.',
      });
      return;
    }

    if (comment.userVote === point) {
      removeVoteCommand.mutate(comment.id);
    } else {
      voteCommentCommand.mutate({ id: comment.id, point });
    }
  };

  const isVotePending =
    voteCommentCommand.isPending || removeVoteCommand.isPending;

  if (isEditing) {
    return (
      <div className='island-shell rise-in rounded-2xl p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h4 className='text-sm font-bold text-sea-ink'>Edit Comment</h4>
          <Button
            className='size-8 border-none bg-transparent p-0 text-sea-ink-soft hover:bg-destructive/10 hover:text-destructive'
            onClick={() => setIsEditing(false)}
            variant='ghost'
          >
            <X className='size-4' />
          </Button>
        </div>
        <CommentForm
          comment={comment}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
          topicId={comment.topicId}
        />
      </div>
    );
  }

  return (
    <div className='island-shell rise-in rounded-2xl p-6'>
      <div className='mb-3 flex items-center gap-2'>
        <div className='flex size-5 items-center justify-center rounded bg-sea-ink/10 text-[10px] font-bold'>
          {comment.userId?.[0] ?? '?'}
        </div>
        <span className='text-xs font-bold text-sea-ink-soft'>
          {comment.userId}
        </span>
        <span className='text-[10px] text-sea-ink-soft/40'>
          • {new Date(comment.createdAt).toLocaleDateString()}
        </span>
        {comment.isAccepted && (
          <span className='ml-auto flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600'>
            <CheckCircle2 className='size-3' />
            Accepted Answer
          </span>
        )}
      </div>
      <p className='text-sm leading-relaxed text-sea-ink/80'>
        {comment.content}
      </p>
      <div className='mt-4 flex items-center justify-between border-t border-line/30 pt-4'>
        <div className='flex items-center gap-1 rounded-lg bg-sea-ink/5 p-1'>
          <Button
            className={`flex size-8 items-center justify-center rounded-md transition-colors ${
              comment.userVote === 1
                ? 'bg-lagoon text-white hover:bg-lagoon-deep'
                : 'text-sea-ink-soft hover:bg-sea-ink/5 hover:text-sea-ink'
            }`}
            disabled={isVotePending}
            onClick={() => handleVote(1)}
            size='icon'
            variant='ghost'
          >
            <ChevronUp className='size-5' />
          </Button>

          <span className='min-w-6 text-center text-xs font-bold text-sea-ink'>
            {comment.voteScore ?? 0}
          </span>

          <Button
            className={`flex size-8 items-center justify-center rounded-md transition-colors ${
              comment.userVote === -1
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'text-sea-ink-soft hover:bg-sea-ink/5 hover:text-sea-ink'
            }`}
            disabled={isVotePending}
            onClick={() => handleVote(-1)}
            size='icon'
            variant='ghost'
          >
            <ChevronDown className='size-5' />
          </Button>
        </div>

        {isOwner && (
          <Button
            className='h-8 gap-1.5 px-3 text-xs font-bold text-sea-ink-soft hover:text-sea-ink'
            onClick={() => setIsEditing(true)}
            variant='ghost'
          >
            <Pencil className='size-3.5' />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}

