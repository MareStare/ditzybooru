import { useSyncExternalStore } from 'react';

import { DEFAULT_COMPONENT_SETTINGS, getComponentSettings, subscribeComponentSettings } from '#/lib/componentSettings';
import type { ComponentSettings } from '#/lib/componentSettings';

/**
 * The current per-component settings, kept in step across every component
 * showing them. Writes go through `setComponentSetting` in
 * `lib/componentSettings`.
 */
export function useComponentSettings(): ComponentSettings {
  // The server snapshot is the shipped default: there is no localStorage to
  // read during SSR, and the pre-paint script has not run yet either.
  return useSyncExternalStore(subscribeComponentSettings, getComponentSettings, () => DEFAULT_COMPONENT_SETTINGS);
}
