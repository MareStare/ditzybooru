import { Link } from '@tanstack/react-router';
import { SlidersHorizontal, MonitorCog } from 'lucide-react';

import { Button } from '#/components/ui/Button';
import { Dropdown } from '#/components/ui/Dropdown';
import { AppearanceSettingsControls } from './AppearanceSettings';

/**
 * The single appearance control in the top bar. Owns no state of its own — it
 * is the trigger, the settings block, and a way into the appearance settings
 * page.
 */
export function ThemeMenu() {
  return (
    <Dropdown
      align="end"
      // Hidden on phones, where the same controls sit in the burger drawer.
      className="theme-menu-anchor"
      trigger={
        <Button variant="ghost" icon title="Appearance" aria-label="Appearance">
          <MonitorCog size={16} />
        </Button>
      }
    >
      <div className="menu theme-menu">
        <AppearanceSettingsControls />

        <hr className="theme-menu__separator" />

        <Link to="/settings/appearance" className="theme-menu__link">
          <SlidersHorizontal size={16} />
          More settings
        </Link>
      </div>
    </Dropdown>
  );
}
