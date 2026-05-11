/** biome-ignore-all lint/suspicious/noArrayIndexKey: ignore */
export function SubstackListSkeleton() {
  return (
    <>
      <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div className='space-y-1'>
          <div className='h-4 w-32 animate-pulse rounded bg-line/20' />
          <div className='h-10 w-48 animate-pulse rounded bg-line/20' />
          <div className='h-4 w-96 animate-pulse rounded bg-line/20' />
        </div>
        <div className='h-11 w-40 animate-pulse rounded-xl bg-line/20' />
      </div>

      <div className='mb-8 flex flex-col gap-4 sm:flex-row'>
        <div className='h-12 flex-1 animate-pulse rounded-xl bg-line/20' />
        <div className='h-12 w-24 animate-pulse rounded-xl bg-line/20' />
      </div>

      <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({
          length: 6,
        }).map((_, i) => (
          <div
            className='island-shell h-64 animate-pulse rounded-2xl border border-line'
            key={i}
          />
        ))}
      </div>
    </>
  );
}
