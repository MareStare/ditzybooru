import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell, ChevronDown, Filter, Mail, Menu as MenuIcon, Upload } from 'lucide-react';

import { Avatar } from '#/components/ui/Avatar';
import { Button } from '#/components/ui/Button';
import { Dropdown } from '#/components/ui/Dropdown';
import { Menu, MenuLink, MenuSeparator } from '#/components/ui/Menu';
import { currentUser } from '#/lib/mock/data';
import { HeaderNav } from './HeaderNav';
import { MobileMenu } from './MobileMenu';
import { SearchBar } from './SearchBar';
import { ThemeMenu } from './ThemeMenu';

const userMenuLinks: Array<{ label: string; href: string }> = [
  { label: 'Watched', href: '/search?q=my:watched' },
  { label: 'Faves', href: '/search?q=my:faves' },
  { label: 'Upvotes', href: '/search?q=my:upvotes' },
  { label: 'Galleries', href: '/galleries' },
  { label: 'Uploads', href: '/search?q=my:uploads' },
  { label: 'Comments', href: '/comments?cq=my:comments' },
  { label: 'Settings', href: '/settings/edit' },
  { label: 'Logout', href: '/sessions' },
];

function UserMenu() {
  const user = currentUser;

  if (!user) {
    return (
      <>
        <Link
          // @ts-expect-error TODO: route not built yet
          to="/registrations/new"
          className="nav-link nav__compact-hidden"
        >
          Register
        </Link>
        <Link
          // @ts-expect-error TODO: route not built yet
          to="/sessions/new"
          className="nav-link"
        >
          Login
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        // @ts-expect-error TODO: route not built yet
        to="/notifications"
        className="nav-link nav-link--badged nav__bottom-nav-hidden"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={16} />
        <span className="nav-link__badge">3</span>
      </Link>
      <Link
        // @ts-expect-error TODO: route not built yet
        to="/conversations"
        className="nav-link nav__bottom-nav-hidden"
        title="Conversations"
        aria-label="Conversations"
      >
        <Mail size={16} />
      </Link>
      <Link
        // @ts-expect-error TODO: route not built yet
        to="/filters"
        className="nav-link"
        title="Filters"
        aria-label="Filters"
      >
        <Filter size={16} />
      </Link>

      <Dropdown
        align="end"
        trigger={
          <button type="button" className="nav-link" aria-label="User menu">
            <Avatar name={user.name} src={user.avatarUrl} />
            <ChevronDown className="dropdown__chevron" size={14} />
          </button>
        }
      >
        <Menu>
          <MenuLink href={`/profiles/${user.slug}`}>
            <strong>{user.name}</strong>
          </MenuLink>
          <MenuSeparator />
          {userMenuLinks.map(link => (
            <MenuLink key={link.href} href={link.href}>
              {link.label}
            </MenuLink>
          ))}
        </Menu>
      </Dropdown>
    </>
  );
}

/** The sticky application header: brand, search and user actions + nav bar. */
export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="nav">
      <div className="nav-bar nav-bar--primary">
        {/* Grouped so the bar can be three columns with the search field in the
            middle one: centred on the viewport rather than on whatever is left
            over between the brand and the account controls. */}
        <div className="nav__start">
          <Button
            variant="ghost"
            icon
            className="nav__burger"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => {
              setMobileMenuOpen(true);
            }}
          >
            <MenuIcon size={18} />
          </Button>

          <Link to="/" className="nav-brand" aria-label="Home">
            <span className="nav-brand__mark">D</span>
            <span className="nav-brand__name">Ditzybooru</span>
          </Link>

          <Link
            // @ts-expect-error TODO: route not built yet
            to="/images/new"
            className="nav-link nav__compact-hidden"
            title="Upload"
            aria-label="Upload"
          >
            <Upload size={16} />
          </Link>
        </div>

        <SearchBar className="nav-search--bar" />

        <div className="nav__actions">
          <ThemeMenu />
          <UserMenu />
        </div>
      </div>

      <HeaderNav />

      {mobileMenuOpen ? (
        <MobileMenu
          onClose={() => {
            setMobileMenuOpen(false);
          }}
        />
      ) : null}
    </header>
  );
}
