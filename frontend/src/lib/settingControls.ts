import {
  ALargeSmall,
  AlignVerticalSpaceAround,
  Bold,
  Layers,
  Palette,
  SquareDashed,
  SquareRoundCorner,
  SunMoon,
  Zap,
} from 'lucide-react';

import { unwrap } from '#/lib/assertions';
import { THEME_COLORS, THEME_LIGHTNESS_OPTIONS } from '#/lib/theme';
import { DEFAULT_DISPLAY_SETTINGS, DISPLAY_SETTING_CONTROLS } from '#/lib/displaySettings';
import type { DisplaySettingRange, DisplaySettings } from '#/lib/displaySettings';
import { DEFAULT_SETTINGS } from '#/lib/settings';
import {
  setDisplaySetting,
  setMotionPreference,
  setThemeColor,
  setThemeLightnessPreference,
} from '#/lib/settingsStore';

import type { LucideIcon } from 'lucide-react';
import type { MotionPreference } from '#/lib/motion';
import type { ThemeColor, ThemeLightnessPreference } from '#/lib/theme';
import type { Settings } from '#/lib/settings';

/**
 * One descriptor per display control, theme and layout alike.
 *
 * The theme's lightness and hue used to be hand-written into the menu while the
 * layout settings came from a table, which meant every change - default
 * markers, the reset button, a new label - had to be made twice and was made
 * twice differently. Here they are the same kind of thing: a label, a set of
 * stops, where the current value comes from and where a new one goes. The only
 * difference left is which widget draws them, and that is one field.
 *
 * Persistence is not split any more: every control below writes into the one
 * settings cookie via `lib/settingsStore`. What still differs is what a control
 * puts on `<html>` - the theme writes attributes, the layout settings write
 * custom properties - and `lib/settings` owns that.
 */
export interface SettingControl {
  id: string;
  /** Plain-English name. Deliberately not the custom property it writes. */
  label: string;
  /** Drawn beside the label. Decoration for the reader scanning the rail for
   *  one setting - the label is what names the control, so the icon is
   *  `aria-hidden` where it is rendered. */
  icon: LucideIcon;
  /** Which widget draws the stops. */
  widget: 'segmented' | 'swatches' | 'slider' | 'switch';
  options: Array<{ value: string | number; label: string }>;
  /** Set on slider controls only, and the range the slider spans. */
  range?: DisplaySettingRange;
  read: (settings: Settings) => string | number;
  /* Takes the widened value the widget hands back. Each implementation narrows
   * it at the boundary, which is sound because the only values a widget can
   * produce are the ones in `options` directly above it. */
  write: (value: string | number) => void;
  defaultValue: string | number;
  /** What the reset button names as the value it would restore. `undefined` for
   *  the two settings whose default is `system`: what that restores to is the
   *  OS's answer, which only a browser can give, so `DisplaySettings` fills it
   *  in from the resolved value once it has one. */
  defaultLabel: string | undefined;
}

/** Keyed by `DisplaySettingControl.key`, so a new slider setting fails to
 *  compile until it has one. */
const DISPLAY_SETTING_ICONS: Record<keyof DisplaySettings, LucideIcon> = {
  radius: SquareRoundCorner,
  borderWidth: SquareDashed,
  shadow: Layers,
  density: AlignVerticalSpaceAround,
  fontScale: ALargeSmall,
  weightBoost: Bold,
};

export const SETTING_CONTROLS: Array<SettingControl> = [
  {
    id: 'lightness',
    label: 'Lightness',
    icon: SunMoon,
    widget: 'segmented',
    options: THEME_LIGHTNESS_OPTIONS.map(option => ({ value: option.id, label: option.label })),
    read: settings => settings.lightness,
    write: value => {
      setThemeLightnessPreference(value as ThemeLightnessPreference);
    },
    defaultValue: DEFAULT_SETTINGS.lightness,
    defaultLabel: undefined,
  },
  {
    id: 'hue',
    label: 'Accent',
    icon: Palette,
    widget: 'swatches',
    options: THEME_COLORS.map(entry => ({ value: entry.id, label: entry.label })),
    read: settings => settings.color,
    write: value => {
      setThemeColor(value as ThemeColor);
    },
    defaultValue: DEFAULT_SETTINGS.color,
    defaultLabel: unwrap(THEME_COLORS.find(entry => entry.id === DEFAULT_SETTINGS.color)).label,
  },
  ...DISPLAY_SETTING_CONTROLS.map(control => ({
    id: control.key,
    label: control.label,
    icon: DISPLAY_SETTING_ICONS[control.key],
    widget: 'slider' as const,
    options: [],
    range: control.range,
    read: (settings: Settings) => settings.display[control.key],
    write: (value: string | number) => {
      setDisplaySetting(control, Number(value));
    },
    defaultValue: DEFAULT_DISPLAY_SETTINGS[control.key],
    defaultLabel: String(DEFAULT_DISPLAY_SETTINGS[control.key]),
  })),
  {
    id: 'motion',
    label: 'Animations',
    icon: Zap,
    widget: 'switch',
    options: [
      { value: 'on', label: 'On' },
      { value: 'off', label: 'Off' },
    ],
    read: settings => settings.motion,
    write: value => {
      setMotionPreference(value as MotionPreference);
    },
    defaultValue: DEFAULT_SETTINGS.motion,
    defaultLabel: undefined,
  },
];
