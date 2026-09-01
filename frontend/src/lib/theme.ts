/**
 * Theme settings: the {@link ThemeLightness} (light/dark) and the accent
 * {@link ThemeColor}.
 *
 * What the user picks is a {@link ThemeLightnessPreference} - `light`, `dark`,
 * or `system`. Only an explicit light/dark reaches `<html>`, as
 * `data-theme-lightness`; `system` is stored as nothing at all, which leaves
 * the stylesheet's `prefers-color-scheme` branch in charge. That is what lets
 * the server render the right theme for a first-time visitor without knowing
 * anything about their machine.
 *
 * `system` is not a stop the picker offers. It is the default, and every
 * setting reaches its default through the same reset button; the track shows
 * whichever polarity `system` currently resolves to.
 *
 * Persistence and the store live in `lib/settings` and `lib/settingsStore`.
 */

export type ThemeLightness = 'light' | 'dark';

/** What the user chose. `system` follows `prefers-color-scheme` as it changes. */
export type ThemeLightnessPreference = ThemeLightness | 'system';

export type ThemeColor = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink' | 'gray';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const DEFAULT_THEME_LIGHTNESS_PREFERENCE: ThemeLightnessPreference = 'system';
export const DEFAULT_THEME_COLOR: ThemeColor = 'blue';

/** The stops the picker offers. `system` is deliberately absent: it is the
 *  default, and the reset button beside the track is what returns to it. */
export const THEME_LIGHTNESS_OPTIONS: Array<{ id: ThemeLightness; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

/** The selectable accent colors. Each has a theme file under `styles/themes/`
 *  publishing `--seed-<id>-dark` / `--seed-<id>-light`; the picker swatches read
 *  those back via `var()` to preview a theme that is not currently applied. */
export const THEME_COLORS: Array<{ id: ThemeColor; label: string }> = [
  { id: 'red', label: 'Red' },
  { id: 'orange', label: 'Orange' },
  { id: 'yellow', label: 'Yellow' },
  { id: 'green', label: 'Green' },
  { id: 'teal', label: 'Teal' },
  { id: 'blue', label: 'Blue' },
  { id: 'purple', label: 'Purple' },
  { id: 'pink', label: 'Pink' },
  { id: 'gray', label: 'Gray' },
];

/**
 * What `system` currently resolves to, as a store the settings UI subscribes
 * to. Only the UI needs it, and only to show which stop is in force - the
 * stylesheet resolves `prefers-color-scheme` on its own, so nothing about the
 * page's appearance depends on this.
 *
 * A store rather than state seeded in an effect, because there is no honest
 * value to seed it with: the server cannot know the answer, and a guess is a
 * wrong stop drawn for one frame. Read through `useSyncExternalStore`, the
 * server snapshot is `undefined` and the answer arrives with hydration.
 */
export function resolveSystemLightness(): ThemeLightness {
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light';
}

/**
 * The preference to store for a chosen stop.
 *
 * Choosing the stop that `system` already resolves to stores `system` rather
 * than an explicit override, so light-then-dark on a dark machine lands back on
 * the default rather than on a pinned value that merely looks like it. The
 * alternative leaves a setting that is indistinguishable on screen but no
 * longer follows the OS, with a reset button offering to undo something the
 * reader cannot see.
 *
 * The trade is that the choice tracks the OS afterwards. That is the right way
 * round: a reader who wants to pin a polarity is a reader whose OS is on the
 * other one, and picking that stop does pin it.
 */
export function preferredLightness(lightness: ThemeLightnessPreference): ThemeLightnessPreference {
  return lightness === resolveSystemLightness() ? 'system' : lightness;
}

export function subscribeSystemLightness(listener: () => void): () => void {
  const media = window.matchMedia(DARK_SCHEME_QUERY);
  media.addEventListener('change', listener);
  return () => {
    media.removeEventListener('change', listener);
  };
}
