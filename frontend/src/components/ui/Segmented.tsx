import type { CSSProperties, ReactNode } from 'react';

import { UndoDot } from 'lucide-react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

export interface SegmentedOption<TValue> {
  value: TValue;
  /** The accessible name. Also the visible one unless `preview` is given. */
  label: string;
  /** Drawn in place of the label — a corner, a line weight, an `Aa`. */
  preview?: ReactNode;
}

interface SegmentedProps<TValue> {
  /** Names the group for assistive tech; not rendered. */
  label: string;
  options: Array<SegmentedOption<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
  /** Marked with a dot while the selection is something else, so "how do I put
   *  this back" is answerable without hunting for a reset button. */
  defaultValue?: TValue;
  className?: ClassValue;
}

/**
 * A track with a thumb that slides between its stops, rather than a row of
 * separate buttons: the movement is what says these are one setting with one
 * value. The stops are real buttons in a `radiogroup`, so keyboard and AT see a
 * single-choice control regardless of the animation.
 */
export function Segmented<TValue extends string | number>({
  label,
  options,
  value,
  onChange,
  defaultValue,
  className,
}: SegmentedProps<TValue>) {
  const index = options.findIndex(option => option.value === value);
  const changed = defaultValue !== undefined && defaultValue !== value;

  return (
    <div
      className={cn('segmented', className)}
      role="radiogroup"
      aria-label={label}
      style={{ '--segment-count': options.length } as CSSProperties}
    >
      {/* Hidden from the thumb's own index when nothing matches, so an
          out-of-range stored value parks it on the first stop rather than
          sliding it off the track. */}
      <span className="segmented__thumb" style={{ '--segment-index': Math.max(index, 0) } as CSSProperties} />
      {options.map(option => {
        const isDefault = changed && option.value === defaultValue;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            // Always named explicitly: a stop showing only a preview has no text
            // to be named by, and one that is the default has more to say than
            // the text it does show.
            title={isDefault ? `${option.label} (default)` : option.label}
            aria-label={isDefault ? `${option.label} (default)` : option.label}
            className="segmented__option"
            onClick={() => {
              onChange(option.value);
            }}
          >
            {isDefault ? <UndoDot className="segmented__default-mark" size={11} aria-hidden="true" /> : null}
            {option.preview ?? option.label}
          </button>
        );
      })}
    </div>
  );
}
