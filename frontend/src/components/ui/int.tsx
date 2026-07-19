import { cn } from '#/lib/utils';

interface Props {
  className?: string;
  value: number;
}

/**
 * Formats an integer separating thousands with spaces, e.g. `2147483` → `2 147 483`.
 */
export function Int({ className, value }: Props) {
  // Not using `Intl` impl, because it depends on the ICU package availability on node.
  // eslint-disable-next-line @typescript-eslint/no-misused-spread
  const chars = [...value.toString()];

  for (let i = chars.length - 3; i > 0; i -= 3) {
    chars.splice(i, 0, ' ');
  }

  return (
    // Wrapping in a `<data>` element just in case some custom CSS or user scripts
    // need the machine-readable value.
    <data value={value} className={cn('[word-spacing:-1px] whitespace-pre', className)}>
      {chars.join('')}
    </data>
  );
}
