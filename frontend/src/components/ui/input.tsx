import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '#/lib/utils';

export function Input({ className, ...props }: InputPrimitive.Props) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(
        'flex h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors outline-none',
        'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        'dark:bg-input/30',
        className,
      )}
      {...props}
    />
  );
}
