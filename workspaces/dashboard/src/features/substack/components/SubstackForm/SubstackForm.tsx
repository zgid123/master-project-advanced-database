import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { createSubstack } from '#/features/substack/api';
import { SUBSTACK_QUERY_KEYS } from '#/features/substack/queries/queryKeys';

import { substackFormOptions, useAppForm } from './hooks';

interface ISubstackFormProps {
  onCreated?: () => void;
}

export function SubstackForm({ onCreated }: ISubstackFormProps) {
  const queryClient = useQueryClient();
  const createSubstackMutation = useMutation({
    mutationFn: createSubstack,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SUBSTACK_QUERY_KEYS.list],
      });
      queryClient.invalidateQueries({
        queryKey: [SUBSTACK_QUERY_KEYS.total],
      });
      onCreated?.();
    },
  });
  const form = useAppForm({
    ...substackFormOptions,
    onSubmit: async ({ value }) => {
      await createSubstackMutation.mutateAsync(value);
    },
  });

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
      <Button disabled={form.state.isSubmitting} type='submit'>
        Create Substack
      </Button>
      {createSubstackMutation.isError && (
        <p className='m-0 text-sm font-semibold text-[#f7c46b]'>
          Substack creation failed.
        </p>
      )}
    </form>
  );
}
