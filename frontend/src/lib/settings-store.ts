/**
 * The settings as a subscribable value.
 *
 * A module-level store rather than component state, because the settings are
 * one global thing with more than one view of them on screen at once, and
 * because "is everything at its default" - the question the reset button asks -
 * spans the theme and the display settings together.
 *
 * The store is client-only. On the server the settings come from the root
 * route's context instead, one read per request: a module-level value would be
 * shared by every request the isolate handles.
 */

import { assignComponentSetting, componentSettingsAreDefault } from '#/lib/component-settings';
import type { ComponentSettingControl, ComponentSettings } from '#/lib/component-settings';
import { displaySettingsAreDefault, sanitizeDisplaySetting } from '#/lib/display-settings';
import type { DisplaySettingControl } from '#/lib/display-settings';
import type { DataSourceKind } from '#/lib/api/types';
import { defaultSettings, readSettings, writeSettingsCookie } from '#/lib/settings';
import type { Settings } from '#/lib/settings';
import { preferredMotion } from '#/lib/motion';
import type { MotionPreference } from '#/lib/motion';
import { preferredLightness } from '#/lib/theme';
import type { ThemeColor, ThemeLightnessPreference } from '#/lib/theme';

/** Read on first use rather than at import: the defaults depend on the site,
 *  which the browser learns from the server's dehydrated state. */
let current: Settings | undefined;
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  current ??= readSettings();
  return current;
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Persists and publishes a change. React re-renders `<html>` from the store,
 *  so nothing here touches the DOM. */
function updateSettings(change: (settings: Settings) => Settings): void {
  current = change(getSettings());
  writeSettingsCookie(current);
  for (const listener of listeners) listener();
}

export function setThemeLightnessPreference(lightness: ThemeLightnessPreference): void {
  updateSettings(settings => ({ ...settings, lightness: preferredLightness(lightness) }));
}

export function setThemeColor(color: ThemeColor): void {
  updateSettings(settings => ({ ...settings, color }));
}

export function setMotionPreference(motion: MotionPreference): void {
  updateSettings(settings => ({ ...settings, motion: preferredMotion(motion) }));
}

export function setDisplaySetting(control: DisplaySettingControl, value: unknown): void {
  updateSettings(settings => ({
    ...settings,
    display: { ...settings.display, [control.key]: sanitizeDisplaySetting(control, value) },
  }));
}

export function setComponentSetting<TKey extends keyof ComponentSettings>(
  control: ComponentSettingControl<TKey>,
  value: string | number,
): void {
  updateSettings(settings => {
    const components = { ...settings.components };
    assignComponentSetting(components, control, value);
    return { ...settings, components };
  });
}

export function setDataSource(dataSource: DataSourceKind): void {
  updateSettings(settings => ({ ...settings, dataSource }));
}

/** The only reset the site has: it covers the per-component settings too, even
 *  though those are set on their own cards. The data source is left alone -
 *  it is a developer switch rather than part of the site's appearance. */
export function resetSettings(): void {
  updateSettings(settings => ({ ...defaultSettings(), dataSource: settings.dataSource }));
}

export function settingsAreDefault(settings: Settings): boolean {
  const defaults = defaultSettings();
  return (
    settings.lightness === defaults.lightness &&
    settings.color === defaults.color &&
    settings.motion === defaults.motion &&
    displaySettingsAreDefault(settings.display) &&
    componentSettingsAreDefault(settings.components)
  );
}
