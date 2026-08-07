import {
  DEFAULT_THEME,
  setThemeColor,
  setThemeLightnessPreference,
  THEME_COLORS,
  THEME_LIGHTNESS_PREFERENCES,
} from '#/lib/theme';
import { DEFAULT_DISPLAY_SETTINGS, setDisplaySetting, DISPLAY_SETTING_CONTROLS } from '#/lib/displaySettings';

import type { ThemeColor, ThemeLightnessPreference, ThemeState } from '#/lib/theme';
import type { DisplaySettings } from '#/lib/displaySettings';

/**
 * One descriptor per display control, theme and layout alike.
 *
 * The theme's lightness and hue used to be hand-written into the menu while the
 * layout settings came from a table, which meant every change — default
 * markers, the reset button, a new label — had to be made twice and was made
 * twice differently. Here they are the same kind of thing: a label, a set of
 * stops, where the current value comes from and where a new one goes. The only
 * difference left is which widget draws them, and that is one field.
 *
 * Persistence stays split, because it genuinely is: the theme is two attributes
 * on `<html>` under their own storage keys, the layout settings are six custom
 * properties under one. Both are applied pre-paint by `index.html`.
 */
export interface SettingControl {
  id: string;
  /** Plain-English name. Deliberately not the custom property it writes. */
  label: string;
  /** Which widget draws the stops. */
  widget: 'segmented' | 'swatches';
  options: Array<{ value: string | number; label: string }>;
  read: (state: SettingsState) => string | number;
  /* Takes the widened value the widget hands back. Each implementation narrows
   * it at the boundary, which is sound because the only values a widget can
   * produce are the ones in `options` directly above it. */
  write: (value: string | number) => void;
  defaultValue: string | number;
}

export interface SettingsState {
  theme: ThemeState;
  display: DisplaySettings;
}

export const SETTING_CONTROLS: Array<SettingControl> = [
  {
    id: 'lightness',
    label: 'Color',
    widget: 'segmented',
    options: THEME_LIGHTNESS_PREFERENCES.map(option => ({ value: option.id, label: option.label })),
    read: state => state.theme.preference,
    write: value => {
      setThemeLightnessPreference(value as ThemeLightnessPreference);
    },
    defaultValue: DEFAULT_THEME.preference,
  },
  {
    id: 'hue',
    // No label of its own: it sits directly under the lightness control and the
    // two are one decision made in two parts.
    label: '',
    widget: 'swatches',
    options: THEME_COLORS.map(entry => ({ value: entry.id, label: entry.label })),
    read: state => state.theme.color,
    write: value => {
      setThemeColor(value as ThemeColor);
    },
    defaultValue: DEFAULT_THEME.color,
  },
  ...DISPLAY_SETTING_CONTROLS.map(control => ({
    id: control.key,
    label: control.label,
    widget: 'segmented' as const,
    options: control.options,
    read: (state: SettingsState) => state.display[control.key],
    write: (value: string | number) => {
      setDisplaySetting(control.key, Number(value));
    },
    defaultValue: DEFAULT_DISPLAY_SETTINGS[control.key],
  })),
];
