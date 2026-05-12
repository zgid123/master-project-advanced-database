import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';

import { substackFormOptions, useAppForm } from './hooks';

export function SubstackForm() {
  const form = useAppForm({
    ...substackFormOptions,
    onSubmit: async ({ value }) => {
      console.log('Submitted', value);
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
    </form>
  );
}
