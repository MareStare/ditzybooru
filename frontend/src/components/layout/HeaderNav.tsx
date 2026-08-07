import { ChevronDown, Heart, Mail } from 'lucide-react';

import { Dropdown } from '#/components/ui/Dropdown';
import { Menu, MenuLink } from '#/components/ui/Menu';
import { primaryNav } from '#/lib/mock/site';
import type { NavItem } from '#/lib/mock/site';

function NavEntry({ item }: { item: NavItem }) {
  const children = item.children ?? [];

  if (children.length === 0) {
    return (
      <a href={item.href} className="nav-link">
        {item.label}
      </a>
    );
  }

  return (
    <Dropdown
      trigger={
        <a href={item.href} className="nav-link">
          {item.label}
          <ChevronDown className="dropdown__chevron" size={14} />
        </a>
      }
    >
      <Menu>
        {children.map(child => (
          <MenuLink key={child.href} href={child.href}>
            {child.label}
          </MenuLink>
        ))}
      </Menu>
    </Dropdown>
  );
}

/**
 * The secondary navigation bar (Images / Activity / Forums / Tags / …), with the
 * Donate/Contact actions aligned to the right. Hidden on small screens, where its
 * contents live in the {@link MobileMenu} instead.
 */
export function HeaderNav() {
  return (
    <nav className="nav-bar nav-bar--sub" aria-label="Sections">
      {primaryNav.map(item => (
        <NavEntry key={item.href} item={item} />
      ))}

      <span className="nav-sub__spacer" />

      <div className="nav-sub__actions">
        {/* The appearance settings page lives in the appearance menu — it is a
            styling tool, so it belongs with the styling controls. */}
        <a href="/pages/donations" className="nav-link nav-link--donate" title="Become a patron or donate">
          <Heart size={14} />
          Donate
        </a>
        <a href="/pages/contact" className="nav-link" title="Contact us">
          <Mail size={14} />
          Contact
        </a>
      </div>
    </nav>
  );
}
