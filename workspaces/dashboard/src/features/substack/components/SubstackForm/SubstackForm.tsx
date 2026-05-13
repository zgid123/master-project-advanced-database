import { useCommand, useQueryClient } from '@alphacifer/react/query';
import type { TNewSubstack, TSubstackEntity } from '@domain/auth';

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';

import { createSubstack, updateSubstack } from '../../api/substackApi';
import { SUBSTACK_QUERY_KEYS } from '../../queries/queryKeys';
import { substackFormOptions, useAppForm } from './hooks';

export function SubstackForm({
  substack,
  onSuccess,
}: {
  onSuccess?: () => void;
  substack?: TSubstackEntity;
}) {
  const queryClient = useQueryClient();

  const createSubstackCommand = useCommand(createSubstack, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBSTACK_QUERY_KEYS.list] });
      queryClient.invalidateQueries({ queryKey: [SUBSTACK_QUERY_KEYS.owned] });
      queryClient.invalidateQueries({ queryKey: [SUBSTACK_QUERY_KEYS.total] });
      onSuccess?.();
    },
  });

  const updateSubstackCommand = useCommand(
    (data: TNewSubstack) => updateSubstack(substack?.slug || '', data),
    {
      onSuccess: (updatedSubstack) => {
        queryClient.invalidateQueries({
          queryKey: [SUBSTACK_QUERY_KEYS.list],
        });
        queryClient.invalidateQueries({
          queryKey: [SUBSTACK_QUERY_KEYS.owned],
        });
        queryClient.invalidateQueries({
          queryKey: [SUBSTACK_QUERY_KEYS.detail, substack?.slug || ''],
        });

        if (updatedSubstack.slug !== substack?.slug) {
          queryClient.invalidateQueries({
            queryKey: [SUBSTACK_QUERY_KEYS.detail, updatedSubstack.slug],
          });
        }

        onSuccess?.();
      },
    },
  );

  const form = useAppForm({
    ...substackFormOptions,
    defaultValues: substack
      ? { name: substack.name, description: substack.description }
      : substackFormOptions.defaultValues,
    onSubmit: async ({ value }) => {
      try {
        if (substack) {
          await updateSubstackCommand.mutateAsync(value);
        } else {
          await createSubstackCommand.mutateAsync(value);
        }
      } catch {
        // Mutation error is rendered below.
      }
    },
  });

  const isPending =
    form.state.isSubmitting ||
    createSubstackCommand.isPending ||
    updateSubstackCommand.isPending;

  return (
    <form
      className='flex flex-col gap-5'
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name='name'>
        {(field) => (
          <div className='flex flex-col gap-2'>
            <Label htmlFor='substack-name'>Name</Label>
            <Input
              id='substack-name'
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
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
      <form.Field name='description'>
        {(field) => (
          <div className='flex flex-col gap-2'>
            <Label htmlFor='substack-description'>Description</Label>
            <Input
              id='substack-description'
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              value={field.state.value ?? ''}
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
          : substack
            ? updateSubstackCommand.error?.message || ''
            : createSubstackCommand.error?.message || ''}
      </div>
      <Button disabled={isPending} type='submit'>
        {isPending
          ? substack
            ? 'Updating...'
            : 'Creating...'
          : substack
            ? 'Update Substack'
            : 'Create Substack'}
      </Button>
    </form>
  );
}
