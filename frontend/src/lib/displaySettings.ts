/**
 * The display settings: the five tier-1 custom properties a user is allowed to
 * change as numbers.
 *
 * Shared rather than owned by the settings page, because the same controls
 * are offered from the header's display menu - the settings page is just a
 * second view onto them. State lives in this module rather than in either
 * component so the two stay in step while both are mounted, which they are on
 * `/settings/display`.
 *
 * Values are validated on the way in. `styles/tokens/display-settings.css`
 * explains why that matters: the settings are unregistered custom properties, so
 * a nonsense value is not rejected at parse time - it propagates into every
 * `calc()` that reads it and collapses the site's spacing rather than falling
 * back.
 *
 * Persistence and the store live in `lib/settings` and `lib/settingsStore`;
 * this module is only the descriptors and their validation.
 */

export interface DisplaySettings {
  radius: number;
  borderWidth: number;
  shadow: number;
  density: number;
  fontScale: number;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  // Square by default: hard corners are what Derpibooru looks like, and this
  // site is a modernization of it rather than a departure from it.
  radius: 0,
  borderWidth: 1,
  shadow: 1,
  density: 1,
  fontScale: 1,
};

export interface DisplaySettingOption {
  value: number;
  /** The accessible name, and the visible one where no preview is drawn. */
  label: string;
}

export interface DisplaySettingControl {
  key: keyof DisplaySettings;
  /** Plain-English name. Deliberately not the custom property it writes: the
   *  people this menu is for do not think in `--border-width`. */
  label: string;
  options: Array<DisplaySettingOption>;
}

/**
 * Three or four named stops per setting, not a continuous slider.
 *
 * A slider offers a precision nobody wants from a settings menu - the question
 * is "rounded or square", not "which of 17 pixel values" - and it cannot be
 * previewed, because there is no set of positions to draw. Discrete stops can
 * show the reader the actual corner, line weight or letter they are choosing.
 * Every value in between is still reachable by editing the stored
 * `display-settings` entry, which is where that precision belongs.
 */
export const DISPLAY_SETTING_CONTROLS: Array<DisplaySettingControl> = [
  {
    key: 'radius',
    label: 'Corners',
    options: [
      { value: 0, label: 'Square' },
      { value: 6, label: 'Rounded' },
      { value: 12, label: 'Very rounded' },
    ],
  },
  {
    key: 'borderWidth',
    label: 'Outlines',
    options: [
      { value: 0, label: 'None' },
      { value: 1, label: 'Thin' },
      { value: 2, label: 'Thick' },
    ],
  },
  {
    key: 'shadow',
    label: 'Shadows',
    options: [
      { value: 0, label: 'Flat' },
      { value: 1, label: 'Soft' },
      { value: 1.6, label: 'Deep' },
    ],
  },
  {
    key: 'density',
    label: 'Spacing',
    options: [
      { value: 0.85, label: 'Compact' },
      { value: 1, label: 'Cozy' },
      { value: 1.15, label: 'Roomy' },
    ],
  },
  {
    key: 'fontScale',
    label: 'Text size',
    options: [
      { value: 0.9, label: 'Small' },
      { value: 1, label: 'Medium' },
      { value: 1.1, label: 'Large' },
      { value: 1.25, label: 'Huge' },
    ],
  },
];

/**
 * The custom properties a set of settings writes on `<html>`.
 *
 * Only what differs from the defaults, so that a setting the user has never
 * touched is left to the stylesheet's own `:root` value.
 *
 * `--border-force` is the outline setting again as a plain 0 or 1, because a
 * width is a length and CSS cannot turn one into the multiplier that panels
 * scale their compensating shadow by. See `Panel.css`.
 */
export function displaySettingProperties(settings: DisplaySettings): Record<string, string> {
  const properties: Record<string, string> = {};
  if (settings.radius !== DEFAULT_DISPLAY_SETTINGS.radius) {
    properties['--radius-unit'] = `${settings.radius}px`;
  }
  if (settings.borderWidth !== DEFAULT_DISPLAY_SETTINGS.borderWidth) {
    properties['--border-width'] = `${settings.borderWidth}px`;
    properties['--border-force'] = settings.borderWidth === 0 ? '0' : '1';
  }
  if (settings.shadow !== DEFAULT_DISPLAY_SETTINGS.shadow) {
    properties['--shadow-force'] = String(settings.shadow);
  }
  if (settings.density !== DEFAULT_DISPLAY_SETTINGS.density) {
    properties['--density'] = String(settings.density);
  }
  if (settings.fontScale !== DEFAULT_DISPLAY_SETTINGS.fontScale) {
    properties['--font-scale'] = String(settings.fontScale);
  }
  return properties;
}

/**
 * Clamps a stored value into the setting's range, so a hand-edited or stale
 * cookie can never reach the stylesheet as something absurd.
 *
 * A value between two stops is kept rather than snapped: the menu only offers
 * the stops, but someone editing the cookie by hand to try `--radius-unit: 3px`
 * is doing something legitimate, and rounding it away under them would make the
 * setting look broken.
 */
export function sanitizeDisplaySetting(control: DisplaySettingControl, value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_DISPLAY_SETTINGS[control.key];
  }
  const stops = control.options.map(option => option.value);
  const clamped = Math.min(Math.max(...stops), Math.max(Math.min(...stops), value));
  // Guards against binary-float noise (0.30000000000000004) reaching the
  // stylesheet and the stored cookie.
  return Number(clamped.toFixed(2));
}

export function sanitizeDisplaySettings(stored: unknown): DisplaySettings {
  if (typeof stored !== 'object' || stored === null) {
    return DEFAULT_DISPLAY_SETTINGS;
  }

  const values = stored as Partial<Record<keyof DisplaySettings, unknown>>;
  const settings = { ...DEFAULT_DISPLAY_SETTINGS };
  for (const control of DISPLAY_SETTING_CONTROLS) {
    settings[control.key] = sanitizeDisplaySetting(control, values[control.key]);
  }
  return settings;
}

/** Whether anything has been changed from the shipped defaults. */
export function displaySettingsAreDefault(settings: DisplaySettings): boolean {
  return DISPLAY_SETTING_CONTROLS.every(control => settings[control.key] === DEFAULT_DISPLAY_SETTINGS[control.key]);
}
