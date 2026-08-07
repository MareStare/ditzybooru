import { useSyncExternalStore } from 'react';

import {
  DEFAULT_APPEARANCE_SETTINGS,
  getAppearanceSettings,
  subscribeAppearanceSettings,
} from '#/lib/appearanceSettings';
import type { AppearanceSettings } from '#/lib/appearanceSettings';

/**
 * The current appearance settings, kept in step across every component showing
 * them. Writes go through `setAppearanceSetting`/`resetAppearanceSettings` in `lib/appearanceSettings`.
 */
export function useAppearanceSettings(): AppearanceSettings {
  // The server snapshot is the shipped default: there is no localStorage to
  // read during SSR, and the pre-paint script has not run yet either.
  return useSyncExternalStore(subscribeAppearanceSettings, getAppearanceSettings, () => DEFAULT_APPEARANCE_SETTINGS);
}
