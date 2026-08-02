import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import { Check, Monitor, Moon, Paintbrush, Palette, Sun } from 'lucide-react';

import { Button } from '#/components/ui/Button';
import { Dropdown } from '#/components/ui/Dropdown';
import { AppearanceKnobs } from './AppearanceKnobs';
import {
  applyThemeColor,
  applyThemeLightnessPreference,
  DEFAULT_THEME_COLOR,
  DEFAULT_THEME_LIGHTNESS,
  DEFAULT_THEME_LIGHTNESS_PREFERENCE,
  onSystemLightnessChange,
  readThemeColor,
  readThemeLightness,
  readThemeLightnessPreference,
  THEME_COLORS,
  THEME_LIGHTNESS_PREFERENCES,
} from '#/lib/theme';
import type { ThemeLightness, ThemeLightnessPreference } from '#/lib/theme';

const LIGHTNESS_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

/**
 * The single appearance control in the top bar: light/dark/system, the accent
 * color, and a way into the UI playground.
 */
export function ThemeMenu() {
  const [preference, setPreference] = useState<ThemeLightnessPreference>(DEFAULT_THEME_LIGHTNESS_PREFERENCE);
  const [lightness, setLightness] = useState<ThemeLightness>(DEFAULT_THEME_LIGHTNESS);
  const [color, setColor] = useState(DEFAULT_THEME_COLOR);

  // Sync from whatever the pre-paint init script already applied to <html>.
  useEffect(() => {
    setPreference(readThemeLightnessPreference());
    setLightness(readThemeLightness());
    setColor(readThemeColor());
  }, []);

  // While the preference is `system`, the OS gets to change the theme out from
  // under us — so follow it rather than only reading it once at startup.
  useEffect(() => {
    if (preference !== 'system') {
      return;
    }
    return onSystemLightnessChange(next => {
      document.documentElement.setAttribute('data-theme-lightness', next);
      setLightness(next);
    });
  }, [preference]);

  const selectPreference = (next: ThemeLightnessPreference) => {
    setLightness(applyThemeLightnessPreference(next));
    setPreference(next);
  };

  const thumbIndex = THEME_LIGHTNESS_PREFERENCES.findIndex(option => option.id === preference);

  return (
    <Dropdown
      align="end"
      trigger={
        <Button variant="ghost" icon title="Appearance" aria-label="Appearance">
          <Palette size={16} />
        </Button>
      }
    >
      <div className="menu theme-menu">
        <p className="theme-menu__title">Appearance</p>
        <div className="theme-switch" role="radiogroup" aria-label="Appearance">
          <span className="theme-switch__thumb" style={{ '--thumb-index': Math.max(thumbIndex, 0) } as CSSProperties} />
          {THEME_LIGHTNESS_PREFERENCES.map(option => {
            const Icon = LIGHTNESS_ICONS[option.id];
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={preference === option.id}
                className="theme-switch__option"
                onClick={() => {
                  selectPreference(option.id);
                }}
              >
                <Icon size={14} />
                {option.label}
              </button>
            );
          })}
        </div>

        <p className="theme-menu__title">Accent color</p>
        <div className="theme-menu__colors">
          {THEME_COLORS.map(entry => {
            const active = entry.id === color;
            return (
              <button
                key={entry.id}
                type="button"
                title={entry.label}
                aria-label={entry.label}
                aria-pressed={active}
                className="theme-swatch"
                // The seed for the polarity currently on screen, so the swatch
                // shows the color as it would actually appear.
                style={{ '--swatch': `var(--seed-${entry.id}-${lightness})` } as CSSProperties}
                onClick={() => {
                  applyThemeColor(entry.id);
                  setColor(entry.id);
                }}
              >
                {active ? <Check size={16} /> : null}
              </button>
            );
          })}
        </div>

        <p className="theme-menu__title">Layout</p>
        <AppearanceKnobs />

        <hr className="theme-menu__separator" />

        <Link to="/ui/playground" className="theme-menu__link">
          <Paintbrush size={16} />
          Playground
        </Link>
      </div>
    </Dropdown>
  );
}
