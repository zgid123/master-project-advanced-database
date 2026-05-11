import { createFileRoute } from '@tanstack/react-router';

import { AuthForm } from '#/features/auth/components';

export const Route = createFileRoute('/sign-up')({
  component: SignUpRoute,
});

function SignUpRoute() {
  return <AuthForm mode='sign-up' />;
}
