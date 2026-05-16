import { useSuspenseQuery } from '@alphacifer/react/query';

import { commentsQueryOptions } from '../queries';
import { CommentItem } from './CommentItem';

export function CommentList({ topicId }: { topicId: string }) {
  const { data: comments } = useSuspenseQuery(commentsQueryOptions(topicId));

  if (!comments || comments.length === 0) {
    return (
      <div className='rounded-2xl border-2 border-dashed border-line p-10 text-center'>
        <p className='text-sea-ink-soft'>
          No comments yet. Be the first to answer!
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {comments.map((comment) => (
        <CommentItem comment={comment} key={comment.id} />
      ))}
    </div>
  );
}
