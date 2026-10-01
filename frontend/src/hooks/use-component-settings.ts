import { useSettings } from '#/hooks/use-settings';
import type { ComponentSettings } from '#/lib/component-settings';

/** The per-component settings. Writes go through `lib/settingsStore`. */
export function useComponentSettings(): ComponentSettings {
  return useSettings().components;
}
