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
 * Persistence and the store live in `lib/settings` and `lib/settingsStore`.
 */

export type ThemeLightness = 'light' | 'dark';

/** What the user chose. `system` follows `prefers-color-scheme` as it changes. */
export type ThemeLightnessPreference = ThemeLightness | 'system';

export type ThemeColor = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink' | 'gray';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const DEFAULT_THEME_LIGHTNESS_PREFERENCE: ThemeLightnessPreference = 'system';
export const DEFAULT_THEME_COLOR: ThemeColor = 'blue';

export const THEME_LIGHTNESS_PREFERENCES: Array<{ id: ThemeLightnessPreference; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
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
 * What `system` currently resolves to. Client-only, and only ever needed by the
 * settings UI to label the `System` option - the stylesheet resolves it on its
 * own via `prefers-color-scheme`, so nothing about the page's appearance
 * depends on this.
 */
export function resolveSystemLightness(): ThemeLightness {
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light';
}

/** Subscribes to OS light/dark changes, for the same labelling purpose. */
export function onSystemLightnessChange(listener: (lightness: ThemeLightness) => void): () => void {
  const media = window.matchMedia(DARK_SCHEME_QUERY);
  const handler = (event: MediaQueryListEvent) => {
    listener(event.matches ? 'dark' : 'light');
  };
  media.addEventListener('change', handler);
  return () => {
    media.removeEventListener('change', handler);
  };
}
