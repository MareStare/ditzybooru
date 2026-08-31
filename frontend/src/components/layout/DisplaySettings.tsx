import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check, Monitor, Moon, Sun, UndoDot, Zap, ZapOff } from 'lucide-react';

import { Segmented } from '#/components/ui/Segmented';
import { useSettings } from '#/hooks/useSettings';
import { SETTING_CONTROLS } from '#/lib/settingControls';
import { onSystemLightnessChange, resolveSystemLightness } from '#/lib/theme';
import { resetSettings, settingsAreDefault } from '#/lib/settingsStore';

import type { ThemeLightness, ThemeLightnessPreference } from '#/lib/theme';
import type { SettingControl } from '#/lib/settingControls';

const LIGHTNESS_ICONS: Record<string, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const MOTION_ICONS: Record<string, typeof Sun> = { on: Zap, off: ZapOff, system: Monitor };

/** An icon beside the stop's word, for the two controls whose stops are modes
 *  rather than values and so have nothing to draw. */
function iconStops(icons: Record<string, typeof Sun>) {
  return (value: string | number, label: string) => {
    const Icon = icons[String(value)] ?? Monitor;
    return (
      <>
        <Icon size={14} />
        {label}
      </>
    );
  };
}

/**
 * What each stop looks like, drawn with the value it is offering, keyed by
 * control id.
 *
 * The preview IS the setting applied to a shape: the corner stops are boxes at
 * that radius, the outline stops are boxes at that border width. That is worth
 * more than a word, because it answers the question the reader actually has -
 * "how round is 'Rounded'?" - which no label can.
 *
 * `Spacing` and `Shadows` are the exceptions. A shadow at menu scale is a few
 * pixels of blur that reads as a smudge, and spacing has nothing to be spaced
 * inside a 28px cell, so both keep their words. `Color` and `Animations` offer
 * modes rather than values, so they get an icon instead of a preview.
 */
const PREVIEWS: Record<string, (value: string | number, label: string) => ReactNode> = {
  lightness: iconStops(LIGHTNESS_ICONS),
  motion: iconStops(MOTION_ICONS),
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
 *  same descriptor drives it - including the default marker. */
function Swatches({
  control,
  value,
  lightness,
}: {
  control: SettingControl;
  value: string | number;
  lightness: ThemeLightness;
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
 * Which polarity is actually on screen, so a swatch can preview its color as it
 * would really appear.
 *
 * Only the swatches need this. Everything else about the theme is settled by
 * the stylesheet, which resolves `system` through `prefers-color-scheme`
 * without asking anyone. Starting at the stored preference keeps the first
 * client render identical to the server's; the effect fills in what only the
 * browser knows.
 */
function useOnScreenLightness(preference: ThemeLightnessPreference): ThemeLightness {
  const [lightness, setLightness] = useState<ThemeLightness>(preference === 'system' ? 'light' : preference);

  useEffect(() => {
    if (preference !== 'system') {
      setLightness(preference);
      return;
    }
    setLightness(resolveSystemLightness());
    return onSystemLightnessChange(setLightness);
  }, [preference]);

  return lightness;
}

/**
 * Every display control the site has: the theme's lightness and hue, the five
 * layout settings, then animations. Shared by the header's display menu and the
 * display settings page's rail - both render this; neither owns the state.
 *
 * There is no per-control code here: the list comes from `SETTING_CONTROLS`,
 * and the only thing this file decides is which widget draws a descriptor and
 * what a stop's preview looks like.
 */
export function DisplaySettingsControls() {
  const settings = useSettings();
  const lightness = useOnScreenLightness(settings.lightness);
  const isDefault = settingsAreDefault(settings);

  return (
    <div className="display-settings">
      {SETTING_CONTROLS.map(control => {
        const value = control.read(settings);
        const preview = PREVIEWS[control.id];

        return (
          <div className="display-setting" key={control.id}>
            {control.label ? <span className="display-setting__label">{control.label}</span> : null}
            {control.widget === 'swatches' ? (
              <Swatches control={control} value={value} lightness={lightness} />
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

      <button type="button" className="display-settings__reset" disabled={isDefault} onClick={resetSettings}>
        <UndoDot size={14} />
        Reset to defaults
      </button>
    </div>
  );
}
