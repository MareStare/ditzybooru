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
 * Applied pre-paint by the inline script in `index.html`, which must be kept in
 * sync with {@link componentSettingAttributes}.
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

const STORAGE_KEY = 'component-settings';

/**
 * The attributes a set of settings writes on `:root`.
 *
 * An attribute rather than a custom property because "justified" is a layout
 * mode, not a value: it swaps the grid for a flex row wrap, which no single
 * property can carry.
 */
export function componentSettingAttributes(settings: ComponentSettings): Record<string, string> {
  return {
    'data-media-fit': settings.mediaFit,
  };
}

/** Rejects anything the control could not have produced, so a hand-edited or
 *  stale entry can never reach the component. */
function sanitize<TKey extends keyof ComponentSettings>(
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
function assign<TKey extends keyof ComponentSettings>(
  settings: ComponentSettings,
  control: ComponentSettingControl<TKey>,
  value: unknown,
): void {
  settings[control.key] = sanitize(control, value);
}

export function readComponentSettings(): ComponentSettings {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_COMPONENT_SETTINGS;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return DEFAULT_COMPONENT_SETTINGS;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_COMPONENT_SETTINGS;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return DEFAULT_COMPONENT_SETTINGS;
  }

  const stored = parsed as Partial<Record<keyof ComponentSettings, unknown>>;
  const settings = { ...DEFAULT_COMPONENT_SETTINGS };
  for (const control of ALL_CONTROLS) {
    assign(settings, control, stored[control.key]);
  }
  return settings;
}

function writeComponentSettings(settings: ComponentSettings): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(componentSettingAttributes(settings))) {
    root.setAttribute(name, value);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

let current = readComponentSettings();
const listeners = new Set<() => void>();

export function getComponentSettings(): ComponentSettings {
  return current;
}

export function subscribeComponentSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* Takes the control rather than its key, and the widened value the widget hands
 * back - which is sound because the only values a widget can produce are the
 * ones its own descriptor offers. */
export function setComponentSetting<TKey extends keyof ComponentSettings>(
  control: ComponentSettingControl<TKey>,
  value: string | number,
): void {
  const next = { ...current };
  assign(next, control, value);
  current = next;
  writeComponentSettings(current);
  for (const listener of listeners) listener();
}

export function resetComponentSettings(): void {
  current = DEFAULT_COMPONENT_SETTINGS;
  writeComponentSettings(current);
  for (const listener of listeners) listener();
}

/** Whether anything has been changed from the shipped defaults. */
export function componentSettingsAreDefault(settings: ComponentSettings): boolean {
  return ALL_CONTROLS.every(control => settings[control.key] === DEFAULT_COMPONENT_SETTINGS[control.key]);
}
