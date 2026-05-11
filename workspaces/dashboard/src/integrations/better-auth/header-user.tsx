import { Link } from '@tanstack/react-router';
import { LogOut, UserRound } from 'lucide-react';

import {
  useCurrentUserQuery,
  useSignOutCommand,
} from '#/features/auth/queries';

export default function BetterAuthHeader() {
  const { data: currentUser, isPending } = useCurrentUserQuery();
  const signOutCommand = useSignOutCommand();

  if (isPending) {
    return (
      <div className='h-9 w-24 animate-pulse rounded-md border border-chip-line bg-chip-bg' />
    );
  }

  if (currentUser) {
    const displayName =
      currentUser.displayName ||
      [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') ||
      currentUser.email;

    return (
      <div className='flex items-center gap-2'>
        <div className='hidden max-w-45 items-center gap-2 rounded-full border border-chip-line bg-chip-bg px-3 py-1.5 text-sm font-semibold text-sea-ink sm:flex'>
          <UserRound className='size-4' />
          <span className='truncate'>{displayName}</span>
        </div>
        <button
          className='inline-flex h-9 items-center gap-2 rounded-md border border-chip-line bg-chip-bg px-3 text-sm font-semibold text-sea-ink hover:bg-link-bg-hover'
          disabled={signOutCommand.isPending}
          onClick={() => {
            signOutCommand.mutate();
          }}
          type='button'
        >
          <LogOut className='size-4' />
          <span className='hidden sm:inline'>Sign out</span>
        </button>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <Link
        className='inline-flex h-9 items-center rounded-md border border-chip-line bg-chip-bg px-3 text-sm font-semibold text-sea-ink no-underline hover:bg-link-bg-hover'
        to='/sign-in'
      >
        Sign in
      </Link>
      <Link
        className='hidden h-9 items-center rounded-md bg-sea-ink px-3 text-sm font-semibold text-white no-underline hover:bg-lagoon-deep sm:inline-flex'
        to='/sign-up'
      >
        Sign up
      </Link>
    </div>
  );
}
