import { Link } from '@tanstack/react-router';
import { SlidersHorizontal, MonitorCog } from 'lucide-react';

import { Button } from '#/components/ui/Button';
import { Dropdown } from '#/components/ui/Dropdown';
import { DisplaySettingsControls } from './DisplaySettings';

/**
 * The single display control in the top bar. Owns no state of its own - it
 * is the trigger, the settings block, and a way into the display settings
 * page.
 */
export function ThemeMenu() {
  return (
    <Dropdown
      align="end"
      // Hidden on phones, where the same controls sit in the burger drawer.
      className="theme-menu-anchor"
      trigger={
        <Button variant="ghost" icon title="Display" aria-label="Display">
          <MonitorCog size={16} />
        </Button>
      }
    >
      <div className="menu theme-menu">
        <DisplaySettingsControls />

        <hr className="theme-menu__separator" />

        <Link to="/settings/display" className="theme-menu__link">
          <SlidersHorizontal size={16} />
          More settings
        </Link>
      </div>
    </Dropdown>
  );
}
