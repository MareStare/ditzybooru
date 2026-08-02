import { Link } from '@tanstack/react-router';
import { Paintbrush, Palette } from 'lucide-react';

import { Button } from '#/components/ui/Button';
import { Dropdown } from '#/components/ui/Dropdown';
import { UiSettingsControls } from './UiSettings';

/**
 * The single appearance control in the top bar. Owns no state of its own — it
 * is the palette trigger, the settings block, and a way into the UI playground.
 */
export function ThemeMenu() {
  return (
    <Dropdown
      align="end"
      className="theme-menu-anchor"
      trigger={
        <Button variant="ghost" icon title="Appearance" aria-label="Appearance">
          <Palette size={16} />
        </Button>
      }
    >
      <div className="menu theme-menu">
        <UiSettingsControls />

        <hr className="theme-menu__separator" />

        <Link to="/ui/playground" className="theme-menu__link">
          <Paintbrush size={16} />
          Playground
        </Link>
      </div>
    </Dropdown>
  );
}
