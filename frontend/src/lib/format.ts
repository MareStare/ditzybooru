/** Formatting helpers shared across the frontend. */

const numberFormatter = new Intl.NumberFormat('en-US');

/** Formats an integer with thousands separators, e.g. `2147483` → `2,147,483`. */
export function formatCount(value: number): string {
  return numberFormatter.format(value);
}

const relativeFormatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
];

/**
 * Renders a timestamp as a coarse relative time, e.g. `"9 minutes ago"`.
 * `now` is injectable so the output is deterministic in tests/SSR.
 */
export function timeAgo(past: Date, now = new Date()): string {
  const deltaSeconds = (past.getTime() - now.getTime()) / 1000;
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(deltaSeconds) >= secondsInUnit || unit === 'second') {
      return relativeFormatter.format(Math.round(deltaSeconds / secondsInUnit), unit);
    }
  }
  return relativeFormatter.format(0, 'second');
}

/** Builds initials from a display name for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}
