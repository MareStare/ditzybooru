import { useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check, Monitor, Moon, Sun, UndoDot } from 'lucide-react';

import { Segmented } from '#/components/ui/Segmented';
import { useComponentSettings } from '#/hooks/useComponentSettings';
import { useTheme } from '#/hooks/useTheme';
import { useDisplaySettings } from '#/hooks/useDisplaySettings';
import { SETTING_CONTROLS } from '#/lib/settingControls';
import { componentSettingsAreDefault, resetComponentSettings } from '#/lib/componentSettings';
import { hydrateTheme, onSystemLightnessChange, resetTheme, setResolvedLightness, themeIsDefault } from '#/lib/theme';
import { resetDisplaySettings, displaySettingsAreDefault } from '#/lib/displaySettings';

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
      className="display-setting-preview display-setting-preview--corner"
      style={{ '--preview-radius': `${value}px` } as CSSProperties}
    />
  ),
  borderWidth: value => (
    <span
      className="display-setting-preview display-setting-preview--outline"
      style={{ '--preview-width': `${value}px` } as CSSProperties}
    />
  ),
  fontScale: value => (
    <span
      className="display-setting-preview display-setting-preview--text"
      style={{ '--preview-scale': value } as CSSProperties}
    >
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
    <div className="display-settings__hues">
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
 * Every display control the site has: the theme's lightness and hue, then
 * the six layout settings. Shared by the header's display menu and the
 * display settings page's rail — both render this; neither owns the state.
 *
 * There is no per-control code here: the list comes from `SETTING_CONTROLS`,
 * and the only thing this file decides is which widget draws a descriptor and
 * what a stop's preview looks like.
 */
export function DisplaySettingsControls() {
  const display = useDisplaySettings();
  const theme = useTheme();
  const components = useComponentSettings();
  const state: SettingsState = { theme, display };

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

  // Covers the per-component settings too, even though those are set on their
  // own cards: this is the only reset the site has.
  const isDefault =
    themeIsDefault(theme) && displaySettingsAreDefault(display) && componentSettingsAreDefault(components);

  return (
    <div className="display-settings">
      {SETTING_CONTROLS.map(control => {
        const value = control.read(state);
        const preview = PREVIEWS[control.id];

        return (
          <div className="display-setting" key={control.id}>
            {control.label ? <span className="display-setting__label">{control.label}</span> : null}
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
        className="display-settings__reset"
        disabled={isDefault}
        onClick={() => {
          resetTheme();
          resetDisplaySettings();
          resetComponentSettings();
        }}
      >
        <UndoDot size={14} />
        Reset to defaults
      </button>
    </div>
  );
}
