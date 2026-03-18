import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'w-full rounded-2xl border border-[var(--border-alpha)] bg-[rgba(8,12,18,0.76)] text-[var(--text-main)] px-[0.95rem] py-[0.85rem] placeholder:text-[var(--text-muted)] resize-y min-h-[120px]',
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
