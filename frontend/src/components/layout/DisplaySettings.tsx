import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Check, Moon, Sun, UndoDot } from 'lucide-react';

import { Switch } from '#/components/ui/Field';
import { ResetButton } from '#/components/ui/ResetButton';
import { Segmented } from '#/components/ui/Segmented';
import { Slider, sliderReadoutWidth } from '#/components/ui/Slider';
import { useSettings } from '#/hooks/useSettings';
import { SETTING_CONTROLS } from '#/lib/settingControls';
import { cn } from '#/lib/utils';
import { resolveSystemMotion, subscribeSystemMotion } from '#/lib/motion';
import { resolveSystemLightness, subscribeSystemLightness } from '#/lib/theme';
import { resetSettings, settingsAreDefault } from '#/lib/settingsStore';

import type { SettingControl } from '#/lib/settingControls';

const LIGHTNESS_ICONS: Record<string, typeof Sun> = { light: Sun, dark: Moon };

/* One width for every slider in the rail, so their tracks start and end at the
 * same two positions. Corners needs two digits and Spacing needs four, and a
 * column of tracks each a few characters longer than the last reads as a
 * mistake rather than as a range that happens to be wider. */
const READOUT_WIDTH = Math.max(
  ...SETTING_CONTROLS.flatMap(control =>
    control.range === undefined ? [] : [sliderReadoutWidth(control.range.min, control.range.max, control.range.step)],
  ),
);

/** An icon beside the stop's word, for the one control whose stops are modes
 *  rather than values and so have nothing to draw. */
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
};

/** The nine hue swatches. A different widget from the segmented tracks, but the
 *  same descriptor drives it. */
function Swatches({ control, value }: { control: SettingControl; value: string | number }) {
  return (
    <div className="display-settings__hues">
      {control.options.map(option => (
        <button
          key={String(option.value)}
          type="button"
          title={option.label}
          aria-label={option.label}
          aria-pressed={option.value === value}
          className="theme-swatch"
          // The fill is `ThemeMenu.css`'s to pick: it needs the seed for the
          // polarity on screen, and only CSS knows that before hydration.
          data-swatch-color={String(option.value)}
          onClick={() => {
            control.write(option.value);
          }}
        >
          {option.value === value ? <Check size={16} /> : null}
        </button>
      ))}
    </div>
  );
}

/**
 * What the two `system` settings currently resolve to.
 *
 * Both are `undefined` until hydration - only a browser can answer them - and
 * that absence is what the widgets below read as `pending`. It does not mean
 * nothing is drawn: `DisplaySettings.css` resolves the same two media queries
 * and paints the right thumb, switch and word at first paint. What JS still
 * owns is the part CSS cannot reach - `aria-checked`, the input's `checked`,
 * and the reset button's tooltip - and those settle a frame later.
 */
function useSystemSettings() {
  return {
    lightness: useSyncExternalStore(subscribeSystemLightness, resolveSystemLightness, () => undefined),
    motion: useSyncExternalStore(subscribeSystemMotion, resolveSystemMotion, () => undefined),
  };
}

/**
 * Every display control the site has: the theme's lightness and hue, the six
 * layout settings, then animations. Shared by the header's display menu and the
 * display settings page's rail - both render this; neither owns the state.
 *
 * There is no per-control code here: the list comes from `SETTING_CONTROLS`,
 * and the only thing this file decides is which widget draws a descriptor, what
 * a stop's preview looks like, and which two settings show a resolved `system`
 * rather than their stored value.
 */
export function DisplaySettingsControls() {
  const settings = useSettings();
  const system = useSystemSettings();

  // What `system` currently means, for the two settings whose default it is.
  // Also what their reset button restores, which is not the same question: a
  // reader who has pinned Light on a dark machine is shown Light and offered a
  // reset to Dark.
  const systemValue: Record<string, string | undefined> = {
    lightness: system.lightness,
    motion: system.motion === undefined ? undefined : system.motion ? 'on' : 'off',
  };

  // What is stored is what the reset button acts on; what is drawn is the
  // stored value, or what `system` means where that is what was stored.
  const onScreen: Record<string, string | undefined> = {
    lightness: settings.lightness === 'system' ? systemValue.lightness : settings.lightness,
    motion: settings.motion === 'system' ? systemValue.motion : settings.motion,
  };

  return (
    <div className="display-settings">
      {SETTING_CONTROLS.map(control => {
        const stored = control.read(settings);
        const pending = control.id in onScreen && onScreen[control.id] === undefined;
        const value = onScreen[control.id] ?? stored;
        // A `system` default has no label of its own: what it restores to is
        // whichever stop the OS currently picks.
        const defaultLabel =
          control.defaultLabel ?? control.options.find(option => option.value === systemValue[control.id])?.label;

        return (
          <div className={cn('display-setting', pending && 'display-setting--pending')} key={control.id}>
            <span className="display-setting__label">{control.label}</span>

            <div className="display-setting__control">
              {control.widget === 'swatches' ? (
                <Swatches control={control} value={value} />
              ) : control.widget === 'switch' ? (
                <Switch
                  className="display-setting__switch"
                  checked={value === 'on'}
                  aria-label={control.label}
                  onChange={event => {
                    control.write(event.target.checked ? 'on' : 'off');
                  }}
                >
                  {/* The word is the stylesheet's while pending, for the same
                      reason the switch itself is. */}
                  {pending ? null : value === 'on' ? 'On' : 'Off'}
                </Switch>
              ) : control.widget === 'slider' && control.range !== undefined ? (
                <Slider
                  label={control.label}
                  value={Number(value)}
                  min={control.range.min}
                  max={control.range.max}
                  step={control.range.step}
                  readoutWidth={READOUT_WIDTH}
                  onChange={control.write}
                />
              ) : (
                <Segmented
                  label={control.label}
                  value={value}
                  pending={pending}
                  onChange={control.write}
                  options={control.options.map(option => ({
                    ...option,
                    preview: PREVIEWS[control.id]?.(option.value, option.label),
                  }))}
                />
              )}

              <ResetButton
                setting={control.label}
                defaultLabel={defaultLabel}
                fromSystem={control.defaultValue === 'system'}
                disabled={stored === control.defaultValue}
                onReset={() => {
                  control.write(control.defaultValue);
                }}
              />
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="display-settings__reset"
        disabled={settingsAreDefault(settings)}
        onClick={resetSettings}
      >
        <UndoDot size={14} />
        Reset all to defaults
      </button>
    </div>
  );
}
