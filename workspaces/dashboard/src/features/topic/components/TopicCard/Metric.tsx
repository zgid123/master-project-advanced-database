import { cn } from '#/shared/utils';

interface IMetricProps {
  label: string;
  strong?: boolean;
  value: number | string;
}

export function Metric({ label, strong, value }: IMetricProps) {
  return (
    <div
      className={cn(
        'rounded-xl border px-2 py-2',
        strong
          ? 'border-lagoon/30 bg-lagoon/12 text-lagoon-deep'
          : 'border-line bg-white/5 text-sea-ink-soft',
      )}
    >
      <div className='text-base font-extrabold text-sea-ink'>{value}</div>
      <div className='text-[0.68rem] font-bold uppercase tracking-[0.12em]'>
        {label}
      </div>
    </div>
  );
}
