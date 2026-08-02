import { useSyncExternalStore } from 'react';

import { DEFAULT_UI_SETTINGS, getUiSettings, subscribeUiSettings } from '#/lib/uiSettings';
import type { UiSettings } from '#/lib/uiSettings';

/**
 * The current appearance settings, kept in step across every component showing
 * them. Writes go through `setUiSetting`/`resetUiSettings` in `lib/uiSettings`.
 */
export function useUiSettings(): UiSettings {
  // The server snapshot is the shipped default: there is no localStorage to
  // read during SSR, and the pre-paint script has not run yet either.
  return useSyncExternalStore(subscribeUiSettings, getUiSettings, () => DEFAULT_UI_SETTINGS);
}
