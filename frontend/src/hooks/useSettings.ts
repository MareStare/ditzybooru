import { createContext, useContext, useSyncExternalStore } from 'react';

import { DEFAULT_SETTINGS } from '#/lib/settings';
import type { Settings } from '#/lib/settings';
import { getSettings, subscribeSettings } from '#/lib/settingsStore';

/**
 * The settings for the request being rendered, published by the root route.
 *
 * Only the server render reads this. On the client the store is already seeded
 * from the same cookie, so both renders produce the same markup and hydration
 * has nothing to reconcile.
 */
export const SsrSettingsContext = createContext<Settings>(DEFAULT_SETTINGS);

/** The current settings, kept in step across every component showing them.
 *  Writes go through `lib/settingsStore`. */
export function useSettings(): Settings {
  const ssrSettings = useContext(SsrSettingsContext);
  return useSyncExternalStore(subscribeSettings, getSettings, () => ssrSettings);
}
