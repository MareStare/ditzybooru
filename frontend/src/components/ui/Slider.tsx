import { useState } from 'react';
import type { CSSProperties } from 'react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

interface SliderProps {
  /** Names the pair for assistive tech; not rendered. */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** The readout's width in `ch`, for a group of sliders that has to share one
   *  - see {@link sliderReadoutWidth}. Defaults to this slider's own range. */
  readoutWidth?: number;
  className?: ClassValue;
}

/** How many decimals the step can produce, and so how many the readout shows. */
function decimalPlaces(step: number): number {
  return String(step).split('.')[1]?.length ?? 0;
}

/**
 * How wide the readout has to be for the widest value in the range, in `ch`.
 *
 * Measured from the range rather than from the value on screen: a field that
 * resizes as its own number grows drags the slider beside it a pixel at a time
 * while you drag the slider. Digits are `tabular-nums`, so one `ch` each; the
 * decimal point is narrower, hence the fraction.
 *
 * Exported because a column of sliders has a second requirement the range alone
 * cannot meet: their tracks have to end at the same place. A host takes the
 * widest of its sliders' widths and hands that one back to all of them.
 */
export function sliderReadoutWidth(min: number, max: number, step: number): number {
  const decimals = decimalPlaces(step);
  const digits = Math.max(String(Math.trunc(min)).length, String(Math.trunc(max)).length) + decimals;

  return digits + (decimals === 0 ? 0 : 0.6);
}

/**
 * A number picked from a range: a slider for the rough answer, and the readout
 * beside it as a field for the exact one.
 *
 * Two controls rather than one because the two questions are different - "a bit
 * more than that" is a drag, "exactly 37" is four keystrokes - and either alone
 * makes the other tedious. They are one `group` to assistive tech, so it reads
 * as one setting offered two ways.
 *
 * The slider is the native control tinted by `accent-color` (set once on
 * `:root`), not a rebuilt one: the browser's already carries keyboard stepping,
 * touch targets and forced-colors support that a `div` would have to re-earn.
 */
export function Slider({ label, value, min, max, step = 1, onChange, readoutWidth, className }: SliderProps) {
  // What is in the field while it is being typed into. A partly typed number is
  // its own state: `""` and `"4"` on the way to `"42"` are neither valid values
  // nor a reason to snap the field out from under the reader.
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (next: number) => {
    if (Number.isFinite(next)) {
      onChange(Math.min(max, Math.max(min, next)));
    }
  };

  return (
    <div
      className={cn('slider', className)}
      role="group"
      aria-label={label}
      style={{ '--readout-width': readoutWidth ?? sliderReadoutWidth(min, max, step) } as CSSProperties}
    >
      <input
        type="range"
        className="slider__range"
        aria-label={`${label} slider`}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={event => {
          onChange(event.target.valueAsNumber);
        }}
      />
      <input
        type="number"
        className="slider__value"
        aria-label={`${label} value`}
        value={draft ?? String(value)}
        min={min}
        max={max}
        step={step}
        onChange={event => {
          setDraft(event.target.value);
          const next = event.target.valueAsNumber;
          // Out-of-range keystrokes are kept in the field but not applied: a `9`
          // typed on the way to `90` must not move the setting to 9 first.
          if (Number.isFinite(next) && next >= min && next <= max) {
            onChange(next);
          }
        }}
        onBlur={event => {
          commit(event.target.valueAsNumber);
          setDraft(null);
        }}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}
