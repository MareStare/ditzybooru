/**
 * Theme settings: the {@link ThemeLightness} (light/dark) and the accent
 * {@link ThemeColor}.
 *
 * Lightness has two layers. What the user picks is a
 * {@link ThemeLightnessPreference} — `light`, `dark`, or `system` — and that is
 * what gets persisted. What the stylesheet sees is the resolved
 * {@link ThemeLightness}, reflected on `<html>` as `data-theme-lightness`
 * alongside `data-theme-color`. Both attributes are applied pre-paint by the
 * inline script in `index.html`, which must be kept in sync with this file.
 */

export type ThemeLightness = 'light' | 'dark';

/** What the user chose. `system` follows `prefers-color-scheme` as it changes. */
export type ThemeLightnessPreference = ThemeLightness | 'system';

export type ThemeColor = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink' | 'gray';

const THEME_LIGHTNESS_STORAGE_KEY = 'theme-lightness';
const THEME_COLOR_STORAGE_KEY = 'theme-color';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const DEFAULT_THEME_LIGHTNESS_PREFERENCE: ThemeLightnessPreference = 'system';
export const DEFAULT_THEME_LIGHTNESS: ThemeLightness = 'dark';
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

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(DARK_SCHEME_QUERY).matches;
}

/** Collapses a preference into the light/dark the stylesheet actually needs. */
export function resolveThemeLightness(preference: ThemeLightnessPreference): ThemeLightness {
  if (preference === 'system') {
    return prefersDark() ? 'dark' : 'light';
  }
  return preference;
}

/** The persisted choice, NOT what is currently on screen. */
export function readThemeLightnessPreference(): ThemeLightnessPreference {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_THEME_LIGHTNESS_PREFERENCE;
  }
  const saved = localStorage.getItem(THEME_LIGHTNESS_STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : DEFAULT_THEME_LIGHTNESS_PREFERENCE;
}

/** What is currently on screen, read back from the attribute. */
export function readThemeLightness(): ThemeLightness {
  if (typeof document === 'undefined') {
    return DEFAULT_THEME_LIGHTNESS;
  }
  const attr = document.documentElement.getAttribute('data-theme-lightness');
  return attr === 'light' || attr === 'dark' ? attr : DEFAULT_THEME_LIGHTNESS;
}

export function readThemeColor(): ThemeColor {
  if (typeof document === 'undefined') {
    return DEFAULT_THEME_COLOR;
  }
  const attr = document.documentElement.getAttribute('data-theme-color');
  return THEME_COLORS.some(c => c.id === attr) ? (attr as ThemeColor) : DEFAULT_THEME_COLOR;
}

export function applyThemeLightnessPreference(preference: ThemeLightnessPreference): ThemeLightness {
  const lightness = resolveThemeLightness(preference);
  document.documentElement.setAttribute('data-theme-lightness', lightness);

  // `system` is stored as the absence of a choice, which is also what a fresh
  // browser has — so the pre-paint script needs no special case for it.
  if (preference === 'system') {
    localStorage.removeItem(THEME_LIGHTNESS_STORAGE_KEY);
  } else {
    localStorage.setItem(THEME_LIGHTNESS_STORAGE_KEY, preference);
  }

  return lightness;
}

export function applyThemeColor(color: ThemeColor): void {
  document.documentElement.setAttribute('data-theme-color', color);
  localStorage.setItem(THEME_COLOR_STORAGE_KEY, color);
}

/**
 * Subscribes to OS light/dark changes. Only meaningful while the preference is
 * `system`; callers are expected to unsubscribe otherwise.
 */
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

/* ---- Store -------------------------------------------------------------- */

/**
 * The theme as a subscribable value, mirroring `lib/appearanceSettings`.
 *
 * A module-level store rather than component state, because the theme is one
 * global setting with more than one view of it, and because "is everything at
 * its default" — the question the reset button asks — spans the theme and the
 * Appearance settings together.
 */
export interface ThemeState {
  preference: ThemeLightnessPreference;
  lightness: ThemeLightness;
  color: ThemeColor;
}

export const DEFAULT_THEME: ThemeState = {
  preference: DEFAULT_THEME_LIGHTNESS_PREFERENCE,
  lightness: DEFAULT_THEME_LIGHTNESS,
  color: DEFAULT_THEME_COLOR,
};

let current: ThemeState = DEFAULT_THEME;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function getTheme(): ThemeState {
  return current;
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Adopts whatever the pre-paint script already put on `<html>`. */
export function hydrateTheme(): void {
  current = {
    preference: readThemeLightnessPreference(),
    lightness: readThemeLightness(),
    color: readThemeColor(),
  };
  notify();
}

export function setThemeLightnessPreference(preference: ThemeLightnessPreference): void {
  current = { ...current, preference, lightness: applyThemeLightnessPreference(preference) };
  notify();
}

/** Only meaningful while the preference is `system`: records what the OS just
 *  switched to, which is already reflected on `<html>` by the caller. */
export function setResolvedLightness(lightness: ThemeLightness): void {
  current = { ...current, lightness };
  notify();
}

export function setThemeColor(color: ThemeColor): void {
  applyThemeColor(color);
  current = { ...current, color };
  notify();
}

export function themeIsDefault(theme: ThemeState): boolean {
  return theme.preference === DEFAULT_THEME.preference && theme.color === DEFAULT_THEME.color;
}

export function resetTheme(): void {
  setThemeColor(DEFAULT_THEME.color);
  setThemeLightnessPreference(DEFAULT_THEME.preference);
}
