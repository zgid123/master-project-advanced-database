import { Button } from '#/components/ui/button';

export function Pagination({
  page,
  totalPages,
  onPageChange,
  isLoading,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className='flex items-center justify-between gap-3'>
      <Button
        disabled={!canPrev || isLoading}
        onClick={() => onPageChange(page - 1)}
        size='sm'
        variant='outline'
      >
        Previous
      </Button>
      <span className='text-sm font-semibold text-sea-ink-soft'>
        Page {page} of {totalPages}
      </span>
      <Button
        disabled={!canNext || isLoading}
        onClick={() => onPageChange(page + 1)}
        size='sm'
        variant='outline'
      >
        Next
      </Button>
    </div>
  );
}
