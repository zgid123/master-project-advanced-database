import type { IErrorProps } from '@alphacifer/react/query';
import { SignIn, SignUp, type TSignIn } from '@domain/auth';
import { useForm } from '@tanstack/react-form';
import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { useSignInCommand, useSignUpCommand } from '#/features/auth/queries';

type TAuthMode = 'sign-in' | 'sign-up';

type TAuthFormValues = TSignIn;

interface IAuthFormProps {
  mode: TAuthMode;
}

function getAuthErrorMessage(error: IErrorProps | null): string | null {
  if (!error) {
    return null;
  }

  return error.detail || error.message || 'Authentication request failed.';
}

function getFormErrorMessage(errors: ReadonlyArray<unknown>): string | null {
  const error = errors[0];

  if (!error) {
    return null;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Check the form values and try again.';
}

export default function AuthForm({ mode }: IAuthFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const isSignIn = mode === 'sign-in';
  const signInCommand = useSignInCommand({
    onSuccess: () => {
      void navigate({ to: '/' });
    },
  });
  const signUpCommand = useSignUpCommand({
    onSuccess: () => {
      void navigate({ to: '/' });
    },
  });
  const authCommand = isSignIn ? signInCommand : signUpCommand;
  const authSchema = isSignIn ? SignIn : SignUp;

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } satisfies TAuthFormValues,
    validators: {
      onDynamic: authSchema,
    },
    onSubmit: async ({ value }) => {
      await authCommand.mutateAsync(value);
    },
  });

  const title = isSignIn ? 'Sign in' : 'Create account';
  const eyebrow = isSignIn ? 'Welcome back' : 'Join Solvit';
  const submitLabel = isSignIn ? 'Sign in' : 'Create account';
  const switchLabel = isSignIn
    ? 'Need an account?'
    : 'Already have an account?';
  const switchTo = isSignIn ? '/sign-up' : '/sign-in';
  const switchAction = isSignIn ? 'Sign up' : 'Sign in';
  const authError = getAuthErrorMessage(authCommand.error);

  return (
    <main className='page-wrap px-4 pb-10 pt-10'>
      <section className='grid items-start gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,460px)]'>
        <div className='pt-4 lg:pt-10'>
          <p className='island-kicker mb-3'>{eyebrow}</p>
          <h1 className='display-title mb-5 max-w-2xl text-4xl leading-[1.02] font-bold tracking-tight text-sea-ink sm:text-6xl'>
            {isSignIn ? 'Continue your work.' : 'Start with your account.'}
          </h1>
          <p className='m-0 max-w-xl text-base leading-7 text-sea-ink-soft sm:text-lg'>
            Access the dashboard with your Solvit credentials. Your session is
            issued by the API gateway and kept in secure HTTP-only cookies.
          </p>
        </div>

        <div className='island-shell rise-in rounded-2xl p-5 sm:p-6'>
          <div className='mb-6'>
            <h2 className='m-0 text-2xl font-bold text-sea-ink'>{title}</h2>
            <p className='mt-2 mb-0 text-sm text-sea-ink-soft'>
              {switchLabel}{' '}
              <Link className='font-semibold' to={switchTo}>
                {switchAction}
              </Link>
            </p>
          </div>

          <form
            className='flex flex-col gap-5'
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field name='email'>
              {(field) => {
                const errorMessage = getFormErrorMessage(
                  field.state.meta.errors,
                );

                return (
                  <div className='flex flex-col gap-2'>
                    <Label htmlFor={emailId}>Email</Label>
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      autoComplete='email'
                      id={emailId}
                      inputMode='email'
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      type='email'
                      value={field.state.value}
                    />
                    {errorMessage ? (
                      <p className='m-0 text-sm font-medium text-destructive'>
                        {errorMessage}
                      </p>
                    ) : null}
                  </div>
                );
              }}
            </form.Field>

            <form.Field name='password'>
              {(field) => {
                const errorMessage = getFormErrorMessage(
                  field.state.meta.errors,
                );

                return (
                  <div className='flex flex-col gap-2'>
                    <Label htmlFor={passwordId}>Password</Label>
                    <div className='relative'>
                      <Input
                        aria-invalid={field.state.meta.errors.length > 0}
                        autoComplete={
                          isSignIn ? 'current-password' : 'new-password'
                        }
                        className='pr-11'
                        id={passwordId}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        type={showPassword ? 'text' : 'password'}
                        value={field.state.value}
                      />
                      <Button
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        className='absolute top-1/2 right-1 -translate-y-1/2'
                        onClick={() => setShowPassword((value) => !value)}
                        size='icon-sm'
                        type='button'
                        variant='ghost'
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                    {errorMessage ? (
                      <p className='m-0 text-sm font-medium text-destructive'>
                        {errorMessage}
                      </p>
                    ) : null}
                  </div>
                );
              }}
            </form.Field>

            {authError ? (
              <div
                className='rounded-md border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
                role='alert'
              >
                {authError}
              </div>
            ) : null}

            <form.Subscribe selector={(state) => state.errors}>
              {(errors) => {
                const formError = getFormErrorMessage(errors);

                return formError ? (
                  <div
                    className='rounded-md border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
                    role='alert'
                  >
                    {formError}
                  </div>
                ) : null;
              }}
            </form.Subscribe>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  className='w-full'
                  disabled={!canSubmit || isSubmitting || authCommand.isPending}
                  type='submit'
                >
                  {isSubmitting || authCommand.isPending ? (
                    <LoaderCircle className='animate-spin' />
                  ) : null}
                  {submitLabel}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </section>
    </main>
  );
}
