import type { ComponentProps } from 'react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

export type BadgeVariant = 'default' | 'success' | 'danger' | 'unread' | 'staff' | 'fave';

interface BadgeProps extends Omit<ComponentProps<'span'>, 'className'> {
  variant?: BadgeVariant;
  className?: ClassValue;
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return <span className={cn('badge', variant !== 'default' && `badge--${variant}`, className)} {...props} />;
}

/** The pulsing dot that marks a badge as reporting live state. */
export function BadgeDot() {
  return <span className="badge__dot" />;
}
