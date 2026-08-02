/**
 * The appearance knobs: the six tier-1 custom properties a user is allowed to
 * change, plus their persistence.
 *
 * Shared rather than owned by the playground, because the same six controls are
 * offered from the header's appearance menu — the playground is just a second
 * view onto them. State lives in this module rather than in either component so
 * the two stay in step while both are mounted, which they are on
 * `/ui/playground`.
 *
 * Values are validated on the way in. `styles/tokens/knobs.css` explains why
 * that matters: the knobs are unregistered custom properties, so a nonsense
 * value is not rejected at parse time — it propagates into every `calc()` that
 * reads it and collapses the site's spacing rather than falling back.
 *
 * Applied pre-paint by the inline script in `index.html`, which must be kept in
 * sync with {@link knobProperties}.
 */

export interface Knobs {
  radius: number;
  borderWidth: number;
  shadow: number;
  density: number;
  fontScale: number;
  motion: number;
}

export const DEFAULT_KNOBS: Knobs = {
  radius: 6,
  borderWidth: 1,
  shadow: 1,
  density: 1,
  fontScale: 1,
  motion: 1,
};

export interface KnobControl {
  key: keyof Knobs;
  /** Plain-English name. Deliberately not the custom property it writes: the
   *  people this menu is for do not think in `--border-width`. */
  label: string;
  min: number;
  max: number;
  step: number;
  /** Renders the current value as words where words are clearer than numbers. */
  format: (value: number) => string;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

export const KNOB_CONTROLS: Array<KnobControl> = [
  {
    key: 'radius',
    label: 'Corners',
    min: 0,
    max: 16,
    step: 1,
    format: value => (value === 0 ? 'Square' : `${value}px`),
  },
  {
    key: 'borderWidth',
    label: 'Outlines',
    min: 0,
    max: 3,
    step: 1,
    format: value => ['None', 'Hairline', 'Medium', 'Bold'][value] ?? `${value}px`,
  },
  {
    key: 'shadow',
    label: 'Shadows',
    min: 0,
    max: 2,
    step: 0.05,
    format: value => (value === 0 ? 'Off' : percent(value)),
  },
  {
    key: 'density',
    label: 'Spacing',
    min: 0.75,
    max: 1.4,
    step: 0.05,
    // Named stops rather than a multiplier: "Cozy" is the word every other
    // site's density setting uses, and 1.05 means nothing on its own.
    format: value => (value < 0.9 ? 'Compact' : value < 1.1 ? 'Cozy' : value < 1.3 ? 'Comfortable' : 'Spacious'),
  },
  {
    key: 'fontScale',
    label: 'Text size',
    min: 0.85,
    max: 1.3,
    step: 0.05,
    format: percent,
  },
  {
    key: 'motion',
    label: 'Animation',
    min: 0,
    max: 2,
    step: 0.1,
    format: value => (value === 0 ? 'Off' : percent(value)),
  },
];

const STORAGE_KEY = 'ui-knobs';

/**
 * The custom properties a set of knobs writes on `:root`.
 *
 * `--border-width` and `--shadow-force` are read by `@container style()` queries
 * in `Panel.css`, which compare token streams TEXTUALLY. Those two must be
 * written in exactly the form the query uses — `0px` and `0`, never `0.0px` or
 * `calc(0px)`. `String(Number)` gives the canonical form for both.
 */
export function knobProperties(knobs: Knobs): Record<string, string> {
  return {
    '--radius-unit': `${knobs.radius}px`,
    '--border-width': `${knobs.borderWidth}px`,
    '--shadow-force': String(knobs.shadow),
    '--density': String(knobs.density),
    '--font-scale': String(knobs.fontScale),
    '--motion-scale': String(knobs.motion),
  };
}

/** Clamps to the control's range and snaps to its step, so a hand-edited or
 *  stale stored value can never reach the stylesheet as something absurd. */
function sanitize(control: KnobControl, value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_KNOBS[control.key];
  }
  const clamped = Math.min(control.max, Math.max(control.min, value));
  const snapped = Math.round(clamped / control.step) * control.step;
  // Snapping reintroduces binary-float noise (0.30000000000000004), which is
  // valid CSS but shows up in the inspector and in the stored JSON.
  return Number(snapped.toFixed(2));
}

export function readKnobs(): Knobs {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_KNOBS;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return DEFAULT_KNOBS;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_KNOBS;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return DEFAULT_KNOBS;
  }

  const stored = parsed as Partial<Record<keyof Knobs, unknown>>;
  const knobs = { ...DEFAULT_KNOBS };
  for (const control of KNOB_CONTROLS) {
    knobs[control.key] = sanitize(control, stored[control.key]);
  }
  return knobs;
}

function writeKnobs(knobs: Knobs): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(knobProperties(knobs))) {
    root.style.setProperty(name, value);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(knobs));
}

// A module-level store rather than a context: the knobs are a single global
// setting, and both views of them (the header menu and the playground rail) can
// be on screen at once.
let current = readKnobs();
const listeners = new Set<() => void>();

export function getKnobs(): Knobs {
  return current;
}

export function subscribeKnobs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setKnob<TKey extends keyof Knobs>(key: TKey, value: Knobs[TKey]): void {
  const control = KNOB_CONTROLS.find(candidate => candidate.key === key);
  current = { ...current, [key]: control ? sanitize(control, value) : value };
  writeKnobs(current);
  for (const listener of listeners) listener();
}

export function resetKnobs(): void {
  current = DEFAULT_KNOBS;
  writeKnobs(current);
  for (const listener of listeners) listener();
}

/** Whether anything has been changed from the shipped defaults. */
export function knobsAreDefault(knobs: Knobs): boolean {
  return KNOB_CONTROLS.every(control => knobs[control.key] === DEFAULT_KNOBS[control.key]);
}
