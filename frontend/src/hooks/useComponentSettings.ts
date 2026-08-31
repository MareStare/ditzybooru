import { useSettings } from '#/hooks/useSettings';
import type { ComponentSettings } from '#/lib/componentSettings';

/** The per-component settings. Writes go through `lib/settingsStore`. */
export function useComponentSettings(): ComponentSettings {
  return useSettings().components;
}
