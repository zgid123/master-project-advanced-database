export function TopicListSkeleton() {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          className='h-28 animate-pulse rounded-2xl border border-line bg-chip-bg'
          key={index}
        />
      ))}
    </div>
  );
}
