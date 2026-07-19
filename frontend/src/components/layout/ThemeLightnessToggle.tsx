import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { applyThemeLightness, DEFAULT_THEME_LIGHTNESS, readThemeLightness } from '#/lib/theme';
import type { ThemeLightness } from '#/lib/theme';

/** Toggles between the light and dark themes, persisting the choice. */
export function ThemeLightnessToggle() {
  const [lightness, setLightness] = useState<ThemeLightness>(DEFAULT_THEME_LIGHTNESS);

  // Sync from whatever the pre-paint init script already applied to <html>.
  useEffect(() => {
    setLightness(readThemeLightness());
  }, []);

  const toggle = () => {
    const next: ThemeLightness = lightness === 'dark' ? 'light' : 'dark';
    applyThemeLightness(next);
    setLightness(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      title="Toggle light/dark"
      aria-label="Toggle light/dark theme"
    >
      {lightness === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}
