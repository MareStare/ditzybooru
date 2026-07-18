import type { ComponentProps } from 'react';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '#/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-600/15 text-green-600 dark:bg-green-500/20 dark:text-green-400',
        danger: 'border-transparent bg-red-600/15 text-red-600 dark:bg-red-500/20 dark:text-red-400',
        warning: 'border-transparent bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export function Badge({ className, variant, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}
