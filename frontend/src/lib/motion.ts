/**
 * The animation setting, and the motion actually in force.
 *
 * What the user picks is a {@link MotionPreference} - `on`, `off`, or `system`,
 * exactly as the theme's lightness works. Only an explicit choice reaches
 * `<html>`, as an inline `--motion-scale`; `system` is stored as nothing at
 * all, which leaves the stylesheet's `prefers-reduced-motion` branch in charge.
 *
 * `system` is not something the switch offers. It is the default, reached
 * through the same reset button every other setting has; the switch shows
 * whichever state `system` currently resolves to.
 *
 * {@link motionScale} reads the cascade rather than the setting, because
 * `--motion-scale` is where the two have already been reconciled.
 *
 * Persistence and the store live in `lib/settings` and `lib/settingsStore`.
 */

/** What the user chose. `system` follows `prefers-reduced-motion` as it changes. */
export type MotionPreference = 'on' | 'off' | 'system';

export const DEFAULT_MOTION_PREFERENCE: MotionPreference = 'system';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Whether `system` currently means animations, as a store the settings UI
 * subscribes to - the same shape, and for the same reason, as the theme's
 * {@link resolveSystemLightness}. The stylesheet resolves
 * `prefers-reduced-motion` on its own; only the switch's state needs this.
 */
export function resolveSystemMotion(): boolean {
  return !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** The preference to store for a thrown switch - `system` when it agrees with
 *  `prefers-reduced-motion`, for the reasons in {@link preferredLightness}. */
export function preferredMotion(motion: MotionPreference): MotionPreference {
  if (motion === 'system') {
    return motion;
  }
  return (motion === 'on') === resolveSystemMotion() ? 'system' : motion;
}

export function subscribeSystemMotion(listener: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', listener);
  return () => {
    media.removeEventListener('change', listener);
  };
}

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
