import type { ReactNode } from 'react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

interface DropdownProps {
  /** The control the panel hangs off — a nav link, a button, an avatar. */
  trigger: ReactNode;
  /** Which edge of the trigger the panel aligns to. */
  align?: 'start' | 'end';
  className?: ClassValue;
  children: ReactNode;
}

/**
 * A panel revealed on hover or keyboard focus, anchored under its trigger.
 * See `Dropdown.css` for why this needs no state.
 */
export function Dropdown({ trigger, align = 'start', className, children }: DropdownProps) {
  return (
    <div className={cn('dropdown', className)}>
      {trigger}
      <div className={cn('dropdown__panel', align === 'end' && 'dropdown__panel--end')}>{children}</div>
    </div>
  );
}
