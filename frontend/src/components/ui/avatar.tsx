import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';

import { cn } from '#/lib/utils';

export function Avatar({ className, ...props }: AvatarPrimitive.Root.Props) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-md select-none', className)}
      {...props}
    />
  );
}

export function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image data-slot="avatar-image" className={cn('aspect-square size-full', className)} {...props} />
  );
}

export function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center bg-muted text-xs font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
