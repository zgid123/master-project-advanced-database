import * as React from 'react';

import { cn } from '#/shared/utils';

export interface ITextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, ITextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-line bg-chip-bg px-4 py-3 text-sm text-sea-ink outline-none ring-lagoon/20 transition-all focus:border-lagoon focus:ring-4 placeholder:text-sea-ink-soft/50 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
