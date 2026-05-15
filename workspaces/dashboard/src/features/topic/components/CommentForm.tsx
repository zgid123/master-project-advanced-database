import { useState } from 'react';

import { Button } from '#/components/ui/button';

export function CommentForm({
  initialContent = '',
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  initialContent?: string;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState(initialContent);

  return (
    <form
      className='space-y-3'
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(content.trim());
      }}
    >
      <textarea
        className='min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-sea-ink outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
        placeholder='Share your answer or comment...'
        value={content}
        onChange={(event) => setContent(event.target.value)}
        required
      />
      <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type='submit' disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
