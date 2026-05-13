import { useState } from 'react';

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';

export function TopicForm({
  initialTitle = '',
  initialBody = '',
  initialSubstackId = '',
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  initialTitle?: string;
  initialBody?: string;
  initialSubstackId?: string;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (data: { title: string; body: string; substackId?: string }) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [substackId, setSubstackId] = useState(initialSubstackId);

  return (
    <form
      className='space-y-4'
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          title: title.trim(),
          body: body.trim(),
          substackId: substackId.trim() || undefined,
        });
      }}
    >
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-sea-ink'>Title</label>
        <Input
          placeholder='Write a clear question title'
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-sea-ink'>Details</label>
        <textarea
          className='min-h-35 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-sea-ink outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
          placeholder='Add context, constraints, and what you already tried.'
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-sea-ink'>Substack ID</label>
        <Input
          placeholder='Optional: substack id'
          value={substackId}
          onChange={(event) => setSubstackId(event.target.value)}
        />
      </div>
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
        <Button type='submit' disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
