import { useCommand, useQueryClient } from '@alphacifer/react/query';
import { Loader2 } from 'lucide-react';
import type * as React from 'react';

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Textarea } from '#/components/ui/textarea';

import { createTopic, updateTopic } from '../../api/topicApi';
import { topicQueryKeys } from '../../queries/queryKeys';
import type { TTopic } from '../../types';
import { type TTopicFormValues, topicFormOptions, useAppForm } from './hooks';

export function TopicForm({
  topic,
  substackId: initialSubstackId,
  onSuccess,
  hideSubstackId = false,
}: {
  onSuccess?: () => void;
  topic?: TTopic;
  substackId?: string;
  hideSubstackId?: boolean;
}) {
  const queryClient = useQueryClient();

  const createTopicCommand = useCommand(
    (data: TTopicFormValues) => createTopic(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: topicQueryKeys.all });
      },
    },
  );

  const updateTopicCommand = useCommand(
    (data: TTopicFormValues) => updateTopic({ id: topic?.id || '', ...data }),
    {
      onSuccess: (updatedTopic: TTopic) => {
        queryClient.invalidateQueries({ queryKey: topicQueryKeys.all });
        queryClient.invalidateQueries({
          queryKey: topicQueryKeys.detail(updatedTopic.id),
        });
      },
    },
  );

  const form = useAppForm({
    ...topicFormOptions,
    defaultValues: topic
      ? {
          title: topic.title,
          body: topic.body ?? '',
          substackId: topic.substackId ?? '',
        }
      : {
          ...topicFormOptions.defaultValues,
          substackId: initialSubstackId || '',
        },
    onSubmit: async ({ value }) => {
      try {
        if (topic) {
          await updateTopicCommand.mutateAsync(value);
        } else {
          await createTopicCommand.mutateAsync(value);
        }
        onSuccess?.();
      } catch {
        // Error rendered below
      }
    },
  });

  const isPending =
    form.state.isSubmitting ||
    createTopicCommand.isPending ||
    updateTopicCommand.isPending;

  return (
    <form
      className='flex flex-col gap-5'
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name='title'>
        {(field) => (
          <div className='flex flex-col gap-2'>
            <Label htmlFor='topic-title'>Title</Label>
            <Input
              id='topic-title'
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder='What is on your mind?'
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

      {!hideSubstackId && (
        <form.Field name='substackId'>
          {(field) => (
            <div className='flex flex-col gap-2'>
              <Label htmlFor='topic-substack'>Substack ID (Optional)</Label>
              <Input
                id='topic-substack'
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder='e.g. engineering, design'
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
      )}

      <form.Field name='body'>
        {(field) => (
          <div className='flex flex-col gap-2'>
            <Label htmlFor='topic-body'>Body</Label>
            <Textarea
              className='min-h-32'
              id='topic-body'
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                field.handleChange(e.target.value)
              }
              placeholder='Describe your topic in detail...'
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
          : topic
            ? updateTopicCommand.error?.message || ''
            : createTopicCommand.error?.message || ''}
      </div>

      <Button disabled={isPending} type='submit'>
        {isPending ? (
          <>
            <Loader2 className='mr-2 size-4 animate-spin' />
            {topic ? 'Updating...' : 'Creating...'}
          </>
        ) : topic ? (
          'Update Topic'
        ) : (
          'Create Topic'
        )}
      </Button>
    </form>
  );
}
