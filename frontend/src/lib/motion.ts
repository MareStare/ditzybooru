/**
 * The animation setting, and the motion actually in force.
 *
 * What the user picks is a {@link MotionPreference} - `on`, `off`, or `system`,
 * exactly as the theme's lightness works. Only an explicit choice reaches
 * `<html>`, as an inline `--motion-scale`; `system` is stored as nothing at
 * all, which leaves the stylesheet's `prefers-reduced-motion` branch in charge.
 *
 * {@link motionScale} reads the cascade rather than the setting, because
 * `--motion-scale` is where the two have already been reconciled.
 *
 * Persistence and the store live in `lib/settings` and `lib/settingsStore`.
 */

/** What the user chose. `system` follows `prefers-reduced-motion` as it changes. */
export type MotionPreference = 'on' | 'off' | 'system';

export const DEFAULT_MOTION_PREFERENCE: MotionPreference = 'system';

export const MOTION_PREFERENCES: Array<{ id: MotionPreference; label: string }> = [
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
  { id: 'system', label: 'System' },
];

/**
 * The custom property the preference writes on `<html>`.
 *
 * An inline declaration, so `on` outranks the `prefers-reduced-motion: reduce`
 * rule in `styles/tokens/display-settings.css`. Without that a reader whose OS
 * asks for reduced motion could never turn animations back on.
 */
export function motionProperties(preference: MotionPreference): Record<string, string> {
  if (preference === 'system') {
    return {};
  }
  return { '--motion-scale': preference === 'on' ? '1' : '0' };
}

export function motionScale(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--motion-scale');
  const scale = Number.parseFloat(raw);

  return Number.isFinite(scale) ? scale : 1;
}

export function animationsEnabled(): boolean {
  return motionScale() > 0;
}
