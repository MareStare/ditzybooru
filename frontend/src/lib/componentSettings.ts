/**
 * Per-component settings: the choices that belong to one kind of component
 * rather than to the site's display as a whole.
 *
 * Separate from `lib/displaySettings` on purpose. Those six are tier-1
 * custom properties that every component reads; these are enumerated choices
 * scoped to a single component, offered on that component's card in
 * `/settings/display` rather than in the header's display menu.
 *
 * They still travel as attributes on `:root`, because that is what lets a
 * setting reach every instance of the component without threading a prop
 * through the pages that render it.
 *
 * Persistence and the store live in `lib/settings` and `lib/settingsStore`;
 * this module is only the descriptors and their validation.
 */

/** How a thumbnail fills its media box; each mode is described on its own stop
 *  in {@link MEDIA_GRID_SETTING_CONTROLS}. */
export type MediaFit = 'contain' | 'crop' | 'justified';

export interface ComponentSettings {
  mediaPerPage: number;
  mediaFit: MediaFit;
}

export const DEFAULT_COMPONENT_SETTINGS: ComponentSettings = {
  mediaPerPage: 15,
  // The whole image, letterboxed: a booru thumbnail identifies the upload, and
  // cropping a tall comic page to a square hides the part that does it.
  mediaFit: 'contain',
};

interface BaseSettingControl<TKey extends keyof ComponentSettings> {
  key: TKey;
  /** Plain-English name, shown on the component's card. */
  label: string;
}

/** A handful of named values, drawn as a segmented track. */
interface StopsSettingControl<TKey extends keyof ComponentSettings> extends BaseSettingControl<TKey> {
  widget: 'segmented';
  options: Array<{ value: ComponentSettings[TKey]; label: string; description?: string }>;
}

/** A number out of a range, drawn as a slider. */
interface RangeSettingControl<TKey extends keyof ComponentSettings> extends BaseSettingControl<TKey> {
  widget: 'slider';
  min: number;
  max: number;
  step: number;
}

export type ComponentSettingControl<TKey extends keyof ComponentSettings = keyof ComponentSettings> =
  StopsSettingControl<TKey> | RangeSettingControl<TKey>;

/** The controls the media grid hosts, in its own title bar and on its card. */
export const MEDIA_GRID_SETTING_CONTROLS: Array<ComponentSettingControl> = [
  {
    key: 'mediaPerPage',
    label: 'Per page',
    widget: 'slider',
    min: 1,
    max: 50,
    step: 1,
  },
  {
    key: 'mediaFit',
    label: 'Image fit',
    widget: 'segmented',
    options: [
      { value: 'contain', label: 'Contain', description: 'The whole image, letterboxed into a square cell.' },
      { value: 'crop', label: 'Crop', description: 'The image cropped to fill a square cell.' },
      {
        value: 'justified',
        label: 'Justified',
        description: "Whole images at their own shape, in rows stretched to the panel's width.",
      },
    ],
  },
];

/** Every control there is, so a stored value can be validated against its own. */
const ALL_CONTROLS: Array<ComponentSettingControl> = [...MEDIA_GRID_SETTING_CONTROLS];

/**
 * The attributes a set of settings writes on `<html>`.
 *
 * An attribute rather than a custom property because "justified" is a layout
 * mode, not a value: it swaps the grid for a flex row wrap, which no single
 * property can carry.
 */
export function componentSettingAttributes(settings: ComponentSettings): { 'data-media-fit': MediaFit } {
  return {
    'data-media-fit': settings.mediaFit,
  };
}

/** Rejects anything the control could not have produced, so a hand-edited or
 *  stale cookie can never reach the component. */
export function sanitizeComponentSetting<TKey extends keyof ComponentSettings>(
  control: ComponentSettingControl<TKey>,
  value: unknown,
): ComponentSettings[TKey] {
  if (control.widget === 'segmented') {
    const option = control.options.find(candidate => candidate.value === value);
    return option ? option.value : DEFAULT_COMPONENT_SETTINGS[control.key];
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_COMPONENT_SETTINGS[control.key];
  }
  const clamped = Math.min(control.max, Math.max(control.min, value));
  const snapped = control.min + Math.round((clamped - control.min) / control.step) * control.step;
  // A slider's stops are numbers, so only a number-valued setting can carry one
  // - which the control descriptors above are what guarantee.
  return snapped as ComponentSettings[TKey];
}

/* Writing through the control's own key is what keeps the value's type tied to
 * it: `settings[key] = value` with a key that could be any of them narrows the
 * write type to `never`, and this generic is the standard way out. */
export function assignComponentSetting<TKey extends keyof ComponentSettings>(
  settings: ComponentSettings,
  control: ComponentSettingControl<TKey>,
  value: unknown,
): void {
  settings[control.key] = sanitizeComponentSetting(control, value);
}

export function sanitizeComponentSettings(stored: unknown): ComponentSettings {
  if (typeof stored !== 'object' || stored === null) {
    return DEFAULT_COMPONENT_SETTINGS;
  }

  const values = stored as Partial<Record<keyof ComponentSettings, unknown>>;
  const settings = { ...DEFAULT_COMPONENT_SETTINGS };
  for (const control of ALL_CONTROLS) {
    assignComponentSetting(settings, control, values[control.key]);
  }
  return settings;
}

/** Whether anything has been changed from the shipped defaults. */
export function componentSettingsAreDefault(settings: ComponentSettings): boolean {
  return ALL_CONTROLS.every(control => settings[control.key] === DEFAULT_COMPONENT_SETTINGS[control.key]);
}
