import { createFileRoute } from '@tanstack/react-router';

import { AuthForm } from '#/features/auth/components';

export const Route = createFileRoute('/sign-in')({
  component: SignInRoute,
});

function SignInRoute() {
  return <AuthForm mode='sign-in' />;
}
