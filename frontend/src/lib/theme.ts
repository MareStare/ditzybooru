/**
 * Theme knobs: the {@link ThemeLightness} (light/dark) and the accent
 * {@link ThemeColor}. The applied theme is reflected on `<html>` as the
 * `data-theme-lightness` and `data-theme-color` attributes; both are persisted
 * to localStorage and applied pre-paint by the inline script in `index.html`.
 */

export type ThemeLightness = 'light' | 'dark';
export type ThemeColor = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink' | 'gray';

const THEME_LIGHTNESS_STORAGE_KEY = 'theme-lightness';
const THEME_COLOR_STORAGE_KEY = 'theme-color';

export const DEFAULT_THEME_LIGHTNESS: ThemeLightness = 'dark';
export const DEFAULT_THEME_COLOR: ThemeColor = 'blue';

/** The selectable accent colors. Each color's hue lives in `global.css` as
 *  `--theme-hue-<id>`; the picker swatches read it back via `var()`. */
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

export function applyThemeLightness(lightness: ThemeLightness): void {
  document.documentElement.setAttribute('data-theme-lightness', lightness);
  localStorage.setItem(THEME_LIGHTNESS_STORAGE_KEY, lightness);
}

export function applyThemeColor(color: ThemeColor): void {
  document.documentElement.setAttribute('data-theme-color', color);
  localStorage.setItem(THEME_COLOR_STORAGE_KEY, color);
}
