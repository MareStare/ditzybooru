import type { CSSProperties, ReactNode } from 'react';

import { Segmented } from '#/components/ui/Segmented';
import { useUiSettings } from '#/hooks/useUiSettings';
import {
  DEFAULT_UI_SETTINGS,
  UI_SETTING_CONTROLS,
  resetUiSettings,
  setUiSetting,
  uiSettingsAreDefault,
} from '#/lib/uiSettings';

import type { UiSettings } from '#/lib/uiSettings';
import type { SegmentedOption } from '#/components/ui/Segmented';

/**
 * What each stop looks like, drawn with the value it is offering.
 *
 * The preview IS the setting applied to a shape: the corner stops are boxes at
 * that radius, the outline stops are boxes at that border width. That is worth
 * more than a word, because it answers the question the reader actually has —
 * "how round is 'Rounded'?" — which no label can.
 *
 * `Spacing` and `Shadows` are the exceptions. A shadow at menu scale is a few
 * pixels of blur that reads as a smudge, and spacing has nothing to be spaced
 * inside a 28px cell, so both keep their words.
 */
const PREVIEWS: Partial<Record<keyof UiSettings, (value: number) => ReactNode>> = {
  radius: value => (
    <span
      className="ui-setting-preview ui-setting-preview--corner"
      style={{ '--preview-radius': `${value}px` } as CSSProperties}
    />
  ),
  borderWidth: value => (
    <span
      className="ui-setting-preview ui-setting-preview--outline"
      style={{ '--preview-width': `${value}px` } as CSSProperties}
    />
  ),
  fontScale: value => (
    <span className="ui-setting-preview ui-setting-preview--text" style={{ '--preview-scale': value } as CSSProperties}>
      Aa
    </span>
  ),
};

function optionsFor(
  key: keyof UiSettings,
  options: Array<{ value: number; label: string }>,
): Array<SegmentedOption<number>> {
  const preview = PREVIEWS[key];
  return options.map(option => ({
    ...option,
    preview: preview?.(option.value),
  }));
}

/**
 * The appearance settings, shared by the header's appearance menu and the UI
 * playground's control rail. Both render this; neither owns the state.
 *
 * Labels are plain English rather than the custom property each control writes —
 * the property names are reference material for whoever is editing the design
 * system, and they belong in the playground's token inspector, not on a control
 * a reader is meant to use.
 */
export function UiSettingsControls() {
  const settings = useUiSettings();

  return (
    <div className="ui-settings">
      {UI_SETTING_CONTROLS.map(control => (
        <div className="ui-setting" key={control.key}>
          <span className="ui-setting__label">{control.label}</span>
          <Segmented
            label={control.label}
            options={optionsFor(control.key, control.options)}
            value={settings[control.key]}
            defaultValue={DEFAULT_UI_SETTINGS[control.key]}
            onChange={value => {
              setUiSetting(control.key, value);
            }}
          />
        </div>
      ))}

      <button
        type="button"
        className="ui-settings__reset"
        disabled={uiSettingsAreDefault(settings)}
        onClick={resetUiSettings}
      >
        {/* Decorative: the same `*` that marks the default stop on each control
            above, so the button reads as "go back to the starred values". The
            word "defaults" already says it for anyone not seeing the marks. */}
        <span className="ui-settings__reset-mark" aria-hidden="true">
          *
        </span>
        Reset to defaults
      </button>
    </div>
  );
}
