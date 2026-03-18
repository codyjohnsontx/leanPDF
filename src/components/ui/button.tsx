import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full transition-[transform,background-color,border-color] duration-[160ms] ease hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-[0.64]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-[var(--color-accent)] to-[#ffcb6b] text-[#11161d] font-bold py-[0.78rem] px-[1.18rem]',
        ghost:
          'bg-white/[0.06] text-[var(--text-main)] border border-[var(--border-alpha)] py-[0.72rem] px-4 data-[active=true]:text-[var(--text-main)] data-[active=true]:bg-[var(--accent-soft)] data-[active=true]:border-[rgba(245,171,53,0.26)]',
        tool: 'bg-transparent text-[var(--text-muted)] border border-transparent py-2 px-[0.82rem] data-[active=true]:text-[var(--text-main)] data-[active=true]:bg-[var(--accent-soft)] data-[active=true]:border-[rgba(245,171,53,0.26)]',
        chip: 'bg-white/[0.05] text-[var(--text-muted)] border border-[var(--border-alpha)] py-[0.45rem] px-[0.72rem] data-[active=true]:text-[var(--text-main)] data-[active=true]:bg-[var(--accent-soft)] data-[active=true]:border-[rgba(245,171,53,0.26)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
