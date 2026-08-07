import { useSyncExternalStore } from 'react';

import { DEFAULT_DISPLAY_SETTINGS, getDisplaySettings, subscribeDisplaySettings } from '#/lib/displaySettings';
import type { DisplaySettings } from '#/lib/displaySettings';

/**
 * The current display settings, kept in step across every component showing
 * them. Writes go through `setDisplaySetting`/`resetDisplaySettings` in `lib/displaySettings`.
 */
export function useDisplaySettings(): DisplaySettings {
  // The server snapshot is the shipped default: there is no localStorage to
  // read during SSR, and the pre-paint script has not run yet either.
  return useSyncExternalStore(subscribeDisplaySettings, getDisplaySettings, () => DEFAULT_DISPLAY_SETTINGS);
}
