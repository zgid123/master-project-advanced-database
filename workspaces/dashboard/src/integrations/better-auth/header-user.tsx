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
        className='inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-chip-line bg-chip-bg px-3 text-sm font-semibold text-sea-ink no-underline hover:bg-link-bg-hover'
        to='/sign-in'
      >
        Sign in
      </Link>
      <Link
        className='inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-lagoon/35 bg-lagoon/16 px-3 text-sm font-bold text-lagoon-deep no-underline shadow-[0_10px_24px_rgba(79,184,178,0.12)] hover:bg-lagoon/24'
        to='/sign-up'
      >
        Sign up
      </Link>
    </div>
  );
}
