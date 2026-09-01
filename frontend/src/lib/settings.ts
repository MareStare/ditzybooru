/**
 * Every user-chosen setting, and the one cookie that carries them.
 *
 * A cookie rather than `localStorage` because the server renders the page:
 * these settings decide `<html>`'s attributes and custom properties, so they
 * have to arrive with the request or the first paint is wrong. `localStorage`
 * is invisible to the server, which is what used to force a pre-paint script,
 * and that script is what used to force `suppressHydrationWarning`.
 *
 * Only values differing from the shipped defaults are written, so the cookie
 * stays small - it rides on every same-origin request, `/assets/*` included.
 *
 * What is NOT here: anything the browser can answer on its own. `system`
 * lightness and `system` motion are absences, left to `prefers-color-scheme`
 * and `prefers-reduced-motion` in the stylesheet.
 */

import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';

import {
  DEFAULT_COMPONENT_SETTINGS,
  componentSettingAttributes,
  sanitizeComponentSettings,
} from '#/lib/componentSettings';
import type { ComponentSettings, MediaFit } from '#/lib/componentSettings';
import { DEFAULT_DISPLAY_SETTINGS, displaySettingProperties, sanitizeDisplaySettings } from '#/lib/displaySettings';
import type { DisplaySettings } from '#/lib/displaySettings';
import { DEFAULT_MOTION_PREFERENCE, motionProperties } from '#/lib/motion';
import type { MotionPreference } from '#/lib/motion';
import { DEFAULT_THEME_COLOR, DEFAULT_THEME_LIGHTNESS_PREFERENCE, THEME_COLORS } from '#/lib/theme';
import type { ThemeColor, ThemeLightness, ThemeLightnessPreference } from '#/lib/theme';

export interface Settings {
  lightness: ThemeLightnessPreference;
  color: ThemeColor;
  motion: MotionPreference;
  display: DisplaySettings;
  components: ComponentSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  lightness: DEFAULT_THEME_LIGHTNESS_PREFERENCE,
  color: DEFAULT_THEME_COLOR,
  motion: DEFAULT_MOTION_PREFERENCE,
  display: DEFAULT_DISPLAY_SETTINGS,
  components: DEFAULT_COMPONENT_SETTINGS,
};

export const SETTINGS_COOKIE = 'ditzy-settings';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** What `settingsAttributes` puts on `<html>`. `style` carries the display
 *  settings as custom properties, which React writes through untouched. */
export interface SettingsAttributes {
  'data-theme-lightness'?: ThemeLightness;
  'data-theme-color': ThemeColor;
  'data-media-fit': MediaFit;
  style?: Record<string, string>;
}

/**
 * The `<html>` attributes a set of settings produces, on the server and on the
 * client alike - which is what makes the two renders agree.
 *
 * A default is an absent attribute rather than an explicit one. That is what
 * lets the stylesheet's `prefers-*` branches apply to a visitor who has never
 * chosen anything.
 */
export function settingsAttributes(settings: Settings): SettingsAttributes {
  const style = {
    ...displaySettingProperties(settings.display),
    ...motionProperties(settings.motion),
  };

  return {
    ...(settings.lightness === 'system' ? {} : { 'data-theme-lightness': settings.lightness }),
    'data-theme-color': settings.color,
    ...componentSettingAttributes(settings.components),
    ...(Object.keys(style).length === 0 ? {} : { style }),
  };
}

function isThemeLightnessPreference(value: unknown): value is ThemeLightnessPreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isMotionPreference(value: unknown): value is MotionPreference {
  return value === 'on' || value === 'off' || value === 'system';
}

function isThemeColor(value: unknown): value is ThemeColor {
  return THEME_COLORS.some(color => color.id === value);
}

/** Rejects anything a control could not have produced, so a hand-edited cookie
 *  can never reach the stylesheet as something absurd. */
export function parseSettings(raw: string | undefined): Settings {
  if (raw === undefined) {
    return DEFAULT_SETTINGS;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeURIComponent(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return DEFAULT_SETTINGS;
  }

  const stored = parsed as Partial<Record<keyof Settings, unknown>>;
  return {
    lightness: isThemeLightnessPreference(stored.lightness) ? stored.lightness : DEFAULT_SETTINGS.lightness,
    color: isThemeColor(stored.color) ? stored.color : DEFAULT_SETTINGS.color,
    motion: isMotionPreference(stored.motion) ? stored.motion : DEFAULT_SETTINGS.motion,
    display: sanitizeDisplaySettings(stored.display),
    components: sanitizeComponentSettings(stored.components),
  };
}

function omitDefaults<TSettings extends object>(settings: TSettings, defaults: TSettings): Partial<TSettings> {
  return Object.fromEntries(
    Object.entries(settings).filter(([key, value]) => value !== defaults[key as keyof TSettings]),
  ) as Partial<TSettings>;
}

function settingsPayload(settings: Settings): Record<string, unknown> {
  const display = omitDefaults(settings.display, DEFAULT_DISPLAY_SETTINGS);
  const components = omitDefaults(settings.components, DEFAULT_COMPONENT_SETTINGS);

  return {
    ...(settings.lightness === DEFAULT_SETTINGS.lightness ? {} : { lightness: settings.lightness }),
    ...(settings.color === DEFAULT_SETTINGS.color ? {} : { color: settings.color }),
    ...(settings.motion === DEFAULT_SETTINGS.motion ? {} : { motion: settings.motion }),
    ...(Object.keys(display).length === 0 ? {} : { display }),
    ...(Object.keys(components).length === 0 ? {} : { components }),
  };
}

function readCookieFromDocument(name: string): string | undefined {
  const prefix = `${name}=`;
  for (const entry of document.cookie.split('; ')) {
    if (entry.startsWith(prefix)) {
      return entry.slice(prefix.length);
    }
  }
  return undefined;
}

/**
 * The settings for the request being rendered.
 *
 * Isomorphic on purpose: the server branch is stripped from the client bundle,
 * and both sides read the same cookie, so the server's markup and the client's
 * first render agree without either side knowing about the other. Reading it
 * per request rather than once per module is also what keeps one visitor's
 * settings out of the next visitor's response.
 */
export const readSettings = createIsomorphicFn()
  .server(() => parseSettings(getCookie(SETTINGS_COOKIE)))
  .client(() => parseSettings(readCookieFromDocument(SETTINGS_COOKIE)));

/** Not `HttpOnly`: the settings UI is what writes this. `SameSite=Lax` keeps it
 *  off cross-site requests, and an all-defaults set clears it outright. */
export function writeSettingsCookie(settings: Settings): void {
  const payload = settingsPayload(settings);
  if (Object.keys(payload).length === 0) {
    document.cookie = `${SETTINGS_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
    return;
  }

  const secure = location.protocol === 'https:' ? '; Secure' : '';
  const value = encodeURIComponent(JSON.stringify(payload));
  document.cookie = `${SETTINGS_COOKIE}=${value}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}${secure}`;
}
