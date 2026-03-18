import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-[0.75rem] py-[0.45rem] text-[0.84rem] gap-[0.45rem]',
  {
    variants: {
      variant: {
        default: 'bg-[rgba(88,214,141,0.1)] text-[var(--success)]',
        destructive: 'bg-[rgba(255,123,114,0.12)] text-[var(--danger)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
