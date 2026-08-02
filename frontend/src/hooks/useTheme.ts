import { useSyncExternalStore } from 'react';

import { DEFAULT_THEME, getTheme, subscribeTheme } from '#/lib/theme';
import type { ThemeState } from '#/lib/theme';

/**
 * The current theme, kept in step across every component showing it. Writes go
 * through `setThemeColor` / `setThemeLightnessPreference` in `lib/theme`.
 */
export function useTheme(): ThemeState {
  // The server snapshot is the shipped default: there is no `<html>` to read
  // during SSR, and the pre-paint script has not run yet either.
  return useSyncExternalStore(subscribeTheme, getTheme, () => DEFAULT_THEME);
}
