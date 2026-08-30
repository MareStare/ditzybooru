import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

interface Props {
  className?: ClassValue;
  value: number;
}

/**
 * Formats an integer separating thousands with spaces, e.g. `2147483` → `2 147 483`.
 *
 * Not using `Intl`, because it depends on the ICU package availability on node.
 */
export function formatInt(value: number): string {
  // eslint-disable-next-line @typescript-eslint/no-misused-spread
  const chars = [...value.toString()];

  for (let i = chars.length - 3; i > 0; i -= 3) {
    chars.splice(i, 0, ' ');
  }

  return chars.join('');
}

/** An integer, {@link formatInt}-separated. */
export function Int({ className, value }: Props) {
  return (
    // Wrapping in a `<data>` element just in case some custom CSS or user scripts
    // need the machine-readable value.
    <data value={value} className={cn('int', className)}>
      {formatInt(value)}
    </data>
  );
}
