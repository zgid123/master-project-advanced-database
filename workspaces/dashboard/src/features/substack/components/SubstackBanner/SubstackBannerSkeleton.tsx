export function SubstackBannerSkeleton() {
  return (
    <section className='island-shell overflow-hidden rounded-2xl'>
      <div className='h-24 bg-linear-to-r from-lagoon/20 via-lagoon/10 to-transparent animate-pulse' />
      <div className='relative px-6 pb-6'>
        <div className='-mt-8 mb-4 flex items-end justify-between'>
          <div className='flex size-20 items-center justify-center rounded-2xl border-4 border-[#0b1219] bg-line/20 animate-pulse shadow-xl' />
          <div className='flex gap-2'>
            <div className='h-10 w-10 rounded-xl bg-line/20 animate-pulse' />
            <div className='h-10 w-32 rounded-xl bg-line/20 animate-pulse' />
          </div>
        </div>
        <div className='space-y-2'>
          <div className='h-8 w-48 animate-pulse rounded-lg bg-line/20' />
          <div className='h-4 w-24 animate-pulse rounded-lg bg-line/20' />
        </div>
        <div className='mt-4 space-y-2'>
          <div className='h-4 w-full animate-pulse rounded bg-line/20' />
          <div className='h-4 w-2/3 animate-pulse rounded bg-line/20' />
        </div>
        <div className='mt-6 flex flex-wrap gap-6 border-t border-line/50 pt-6'>
          <div className='flex items-center gap-2'>
            <div className='size-5 animate-pulse rounded-full bg-line/20' />
            <div>
              <div className='h-4 w-12 animate-pulse rounded bg-line/20 mb-1' />
              <div className='h-3 w-16 animate-pulse rounded bg-line/20' />
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <div className='size-5 animate-pulse rounded-full bg-line/20' />
            <div>
              <div className='h-4 w-12 animate-pulse rounded bg-line/20 mb-1' />
              <div className='h-3 w-16 animate-pulse rounded bg-line/20' />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
