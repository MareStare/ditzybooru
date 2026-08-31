import { Slider } from '#/components/ui/Slider';
import { Segmented } from '#/components/ui/Segmented';
import { useComponentSettings } from '#/hooks/useComponentSettings';
import { DEFAULT_COMPONENT_SETTINGS } from '#/lib/componentSettings';
import { setComponentSetting } from '#/lib/settingsStore';
import { cn } from '#/lib/utils';

import type { ComponentSettingControl } from '#/lib/componentSettings';

/**
 * The controls for one component's settings. The counterpart of
 * {@link DisplaySettingsControls}: same widget, same store shape, but the
 * settings here belong to a single component rather than to the whole site.
 *
 * Rendered in two places for every component that has any - the component's own
 * menu, and its card on the display settings page - so neither owns the
 * layout. `inline` is the difference between them: stacked in a menu with room
 * to spare, on one line in a card's title bar.
 */
export function ComponentSettingsControls({
  controls,
  inline = false,
}: {
  controls: Array<ComponentSettingControl>;
  inline?: boolean;
}) {
  const settings = useComponentSettings();

  return (
    <div className={cn('component-settings', inline && 'component-settings--inline')}>
      {controls.map(control => (
        <div className="component-setting" key={control.key}>
          <span className="component-setting__label">{control.label}</span>
          {control.widget === 'slider' ? (
            <Slider
              label={control.label}
              value={Number(settings[control.key])}
              min={control.min}
              max={control.max}
              step={control.step}
              onChange={value => {
                setComponentSetting(control, value);
              }}
            />
          ) : (
            <Segmented
              label={control.label}
              value={settings[control.key]}
              defaultValue={DEFAULT_COMPONENT_SETTINGS[control.key]}
              options={control.options}
              onChange={value => {
                setComponentSetting(control, value);
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
