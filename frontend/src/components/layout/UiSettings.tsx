import { useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check, Monitor, Moon, Sun, UndoDot } from 'lucide-react';

import { Segmented } from '#/components/ui/Segmented';
import { useTheme } from '#/hooks/useTheme';
import { useUiSettings } from '#/hooks/useUiSettings';
import { SETTING_CONTROLS } from '#/lib/settingControls';
import { hydrateTheme, onSystemLightnessChange, resetTheme, setResolvedLightness, themeIsDefault } from '#/lib/theme';
import { resetUiSettings, uiSettingsAreDefault } from '#/lib/uiSettings';

import type { SettingControl, SettingsState } from '#/lib/settingControls';

const LIGHTNESS_ICONS: Record<string, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

/**
 * What each stop looks like, drawn with the value it is offering, keyed by
 * control id.
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
const PREVIEWS: Record<string, (value: string | number, label: string) => ReactNode> = {
  lightness: (value, label) => {
    const Icon = LIGHTNESS_ICONS[String(value)] ?? Sun;
    return (
      <>
        <Icon size={14} />
        {label}
      </>
    );
  },
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

/** The nine hue swatches. A different widget from the segmented tracks, but the
 *  same descriptor drives it — including the default marker. */
function Swatches({
  control,
  value,
  lightness,
}: {
  control: SettingControl;
  value: string | number;
  lightness: string;
}) {
  return (
    <div className="ui-settings__hues">
      {control.options.map(option => {
        const active = option.value === value;
        const isDefault = option.value === control.defaultValue;
        return (
          <button
            key={String(option.value)}
            type="button"
            title={isDefault ? `${option.label} (default)` : option.label}
            aria-label={isDefault ? `${option.label} (default)` : option.label}
            aria-pressed={active}
            className="theme-swatch"
            // The seed for the polarity currently on screen, so the swatch shows
            // the color as it would actually appear.
            style={{ '--swatch': `var(--seed-${String(option.value)}-${lightness})` } as CSSProperties}
            onClick={() => {
              control.write(option.value);
            }}
          >
            {active ? <Check size={16} /> : null}
            {!active && isDefault && value !== control.defaultValue ? (
              <UndoDot className="theme-swatch__default" size={13} aria-hidden="true" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Every appearance control the site has: the theme's lightness and hue, then
 * the six layout settings. Shared by the header's appearance menu and the UI
 * playground's rail — both render this; neither owns the state.
 *
 * There is no per-control code here: the list comes from `SETTING_CONTROLS`,
 * and the only thing this file decides is which widget draws a descriptor and
 * what a stop's preview looks like.
 */
export function UiSettingsControls() {
  const ui = useUiSettings();
  const theme = useTheme();
  const state: SettingsState = { theme, ui };

  // Adopt whatever the pre-paint script put on `<html>`; until this runs the
  // store holds the shipped defaults.
  useEffect(hydrateTheme, []);

  // While the preference is `system`, the OS gets to change the theme out from
  // under us — so follow it rather than only reading it once at startup.
  useEffect(() => {
    if (theme.preference !== 'system') {
      return;
    }
    return onSystemLightnessChange(next => {
      document.documentElement.setAttribute('data-theme-lightness', next);
      setResolvedLightness(next);
    });
  }, [theme.preference]);

  const isDefault = themeIsDefault(theme) && uiSettingsAreDefault(ui);

  return (
    <div className="ui-settings">
      {SETTING_CONTROLS.map(control => {
        const value = control.read(state);
        const preview = PREVIEWS[control.id];

        return (
          <div className="ui-setting" key={control.id}>
            {control.label ? <span className="ui-setting__label">{control.label}</span> : null}
            {control.widget === 'swatches' ? (
              <Swatches control={control} value={value} lightness={theme.lightness} />
            ) : (
              <Segmented
                label={control.label || control.id}
                value={value}
                defaultValue={control.defaultValue}
                onChange={control.write}
                options={control.options.map(option => ({
                  ...option,
                  preview: preview?.(option.value, option.label),
                }))}
              />
            )}
          </div>
        );
      })}

      <button
        type="button"
        className="ui-settings__reset"
        disabled={isDefault}
        onClick={() => {
          resetTheme();
          resetUiSettings();
        }}
      >
        <UndoDot size={14} />
        Reset to defaults
      </button>
    </div>
  );
}
