export function CommentListSkeleton() {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className='h-24 animate-pulse rounded-xl border border-line bg-chip-bg'
          key={index}
        />
      ))}
    </div>
  );
}
