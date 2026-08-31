import { useSettings } from '#/hooks/useSettings';
import type { DisplaySettings } from '#/lib/displaySettings';

/** The six layout settings. Writes go through `lib/settingsStore`. */
export function useDisplaySettings(): DisplaySettings {
  return useSettings().display;
}
