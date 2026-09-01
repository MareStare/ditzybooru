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

import { assignComponentSetting, componentSettingsAreDefault } from '#/lib/componentSettings';
import type { ComponentSettingControl, ComponentSettings } from '#/lib/componentSettings';
import { displaySettingsAreDefault, sanitizeDisplaySetting } from '#/lib/displaySettings';
import type { DisplaySettingControl } from '#/lib/displaySettings';
import { DEFAULT_SETTINGS, readSettings, writeSettingsCookie } from '#/lib/settings';
import type { Settings } from '#/lib/settings';
import { preferredMotion } from '#/lib/motion';
import type { MotionPreference } from '#/lib/motion';
import { preferredLightness } from '#/lib/theme';
import type { ThemeColor, ThemeLightnessPreference } from '#/lib/theme';

let current: Settings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

if (typeof document !== 'undefined') {
  current = readSettings();
}

export function getSettings(): Settings {
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
export function updateSettings(change: (settings: Settings) => Settings): void {
  current = change(current);
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

/** The only reset the site has: it covers the per-component settings too, even
 *  though those are set on their own cards. */
export function resetSettings(): void {
  updateSettings(() => DEFAULT_SETTINGS);
}

export function settingsAreDefault(settings: Settings): boolean {
  return (
    settings.lightness === DEFAULT_SETTINGS.lightness &&
    settings.color === DEFAULT_SETTINGS.color &&
    settings.motion === DEFAULT_SETTINGS.motion &&
    displaySettingsAreDefault(settings.display) &&
    componentSettingsAreDefault(settings.components)
  );
}
