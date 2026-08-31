import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

interface DropdownProps {
  /** The control the panel hangs off - a nav link, a button, an avatar. */
  trigger: ReactNode;
  /** Which edge of the trigger the panel aligns to. */
  align?: 'start' | 'end';
  className?: ClassValue;
  children: ReactNode;
}

/**
 * A panel revealed on hover or keyboard focus, anchored under its trigger.
 * See `Dropdown.css` for why this needs almost no state.
 */
export function Dropdown({ trigger, align = 'start', className, children }: DropdownProps) {
  const [dismissed, setDismissed] = useState(false);

  // Following a link navigates without moving the pointer or the focus, so the
  // hover/focus-within CSS alone would leave the panel open over the new page.
  // Buttons are excluded: the settings controls in these panels are buttons.
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('a[href]')) {
      setDismissed(true);
    }
  };

  // Released on the way back in, never on the way out: hiding the panel pulls
  // it from under the cursor, so a `pointerleave` or `blur` release would fire
  // immediately and flash the panel back open.
  const release = () => {
    setDismissed(false);
  };

  return (
    <div
      className={cn('dropdown', dismissed && 'dropdown--dismissed', className)}
      onClick={handleClick}
      onPointerEnter={release}
      onFocus={release}
    >
      {trigger}
      <div className={cn('dropdown__panel', align === 'end' && 'dropdown__panel--end')}>{children}</div>
    </div>
  );
}
