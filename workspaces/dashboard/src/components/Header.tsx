import { Link } from '@tanstack/react-router';

import BetterAuthHeader from '#/integrations/better-auth/header-user';

export default function Header() {
  return (
    <header className='sticky top-0 z-50 border-b border-line bg-header-bg px-4 backdrop-blur-lg'>
      <nav className='page-wrap grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[1fr_auto_1fr] sm:py-4'>
        <h2 className='m-0 shrink-0 text-base font-semibold tracking-tight'>
          <Link
            className='inline-flex items-center gap-2 rounded-full border border-chip-line bg-chip-bg px-3 py-1.5 text-sm text-sea-ink no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2'
            to='/'
          >
            <span className='size-2 rounded-full bg-linear-to-r from-[#56c6be] to-[#7ed3bf]' />
            Solvit
          </Link>
        </h2>

        <div className='justify-self-end sm:col-start-3'>
          <BetterAuthHeader />
        </div>

        <div className='col-span-2 row-start-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:flex-nowrap sm:pb-0'>
          <Link
            activeProps={{ className: 'nav-link is-active' }}
            className='nav-link'
            to='/'
          >
            Home
          </Link>
          <Link
            activeProps={{ className: 'nav-link is-active' }}
            className='nav-link'
            to='/topics'
          >
            Topics
          </Link>
          <Link
            activeProps={{ className: 'nav-link is-active' }}
            className='nav-link'
            to='/substacks'
          >
            Substacks
          </Link>
          <Link
            activeProps={{ className: 'nav-link is-active' }}
            className='nav-link'
            to='/jobs'
          >
            Jobs
          </Link>
          <Link
            activeProps={{ className: 'nav-link is-active' }}
            className='nav-link'
            to='/about'
          >
            About
          </Link>
        </div>
      </nav>
    </header>
  );
}
