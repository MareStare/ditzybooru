import { useSettings } from '#/hooks/useSettings';
import type { ThemeColor, ThemeLightnessPreference } from '#/lib/theme';

/** The theme half of the settings. Writes go through `lib/settingsStore`. */
export function useTheme(): { preference: ThemeLightnessPreference; color: ThemeColor } {
  const { lightness, color } = useSettings();
  return { preference: lightness, color };
}
