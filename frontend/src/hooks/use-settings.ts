import { createContext, use, useSyncExternalStore } from 'react';

import { unwrap } from '#/lib/assertions';
import type { Settings } from '#/lib/settings';
import { getSettings, subscribeSettings } from '#/lib/settings-store';

/**
 * The settings for the request being rendered, published by the root route.
 *
 * Only the server render reads this. On the client the store is already seeded
 * from the same cookie, so both renders produce the same markup and hydration
 * has nothing to reconcile.
 */
export const SsrSettingsContext = createContext<Settings | null>(null);

/** The current settings, kept in step across every component showing them.
 *  Writes go through `lib/settingsStore`. */
export function useSettings(): Settings {
  const ssrSettings = unwrap(use(SsrSettingsContext));
  return useSyncExternalStore(subscribeSettings, getSettings, () => ssrSettings);
}
