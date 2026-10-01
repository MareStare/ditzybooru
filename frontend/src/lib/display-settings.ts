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
  weightBoost: number;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  // Square by default: hard corners are what Derpibooru looks like, and this
  // site is a modernization of it rather than a departure from it.
  radius: 0,
  borderWidth: 1,
  shadow: 1,
  density: 1,
  fontScale: 1,
  weightBoost: 1,
};

/** A continuous setting, for the one question that has no natural stops. */
export interface DisplaySettingRange {
  min: number;
  max: number;
  step: number;
}

export interface DisplaySettingControl {
  key: keyof DisplaySettings;
  /** Plain-English name. Deliberately not the custom property it writes: the
   *  people this menu is for do not think in `--border-width`. */
  label: string;
  range: DisplaySettingRange;
}

/**
 * One continuous range per setting rather than named stops.
 *
 * Stops were the original design, on the grounds that the question is "rounded
 * or square" rather than "which of 17 pixel values". That holds for a reader
 * picking a look, but not for one correcting a specific discomfort - text a
 * shade too large, a face a shade too heavy - which is what these are actually
 * used for. A range answers both, and the reset button beside each one carries
 * the default that the stops used to mark.
 */
export const DISPLAY_SETTING_CONTROLS: Array<DisplaySettingControl> = [
  { key: 'radius', label: 'Corners', range: { min: 0, max: 24, step: 1 } },
  { key: 'borderWidth', label: 'Outlines', range: { min: 0, max: 4, step: 1 } },
  { key: 'shadow', label: 'Shadows', range: { min: 0, max: 2, step: 0.1 } },
  { key: 'density', label: 'Spacing', range: { min: 0.7, max: 1.4, step: 0.05 } },
  { key: 'fontScale', label: 'Font size', range: { min: 0.8, max: 1.5, step: 0.05 } },
  { key: 'weightBoost', label: 'Font weight', range: { min: 0, max: 2, step: 0.05 } },
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
  if (settings.weightBoost !== DEFAULT_DISPLAY_SETTINGS.weightBoost) {
    properties['--weight-boost'] = String(settings.weightBoost);
  }
  return properties;
}

/**
 * Clamps a stored value into the setting's range, so a hand-edited or stale
 * cookie can never reach the stylesheet as something absurd.
 *
 * The value is clamped rather than snapped to the step: a cookie written by an
 * older build, or edited by hand, is honoured wherever it lands inside the
 * range.
 */
export function sanitizeDisplaySetting(control: DisplaySettingControl, value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_DISPLAY_SETTINGS[control.key];
  }
  const { min, max } = control.range;
  const clamped = Math.min(max, Math.max(min, value));
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
