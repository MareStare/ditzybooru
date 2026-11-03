import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell, ChevronDown, Filter, Mail, Menu as MenuIcon, Upload } from 'lucide-react';

import { useCurrentUser } from '#/hooks/use-current-user';
import { useDataSource } from '#/hooks/use-data-source';
import { useSignOut } from '#/hooks/use-session';
import { useSite } from '#/hooks/use-site';
import { Avatar } from '#/components/ui/Avatar';
import { Button } from '#/components/ui/Button';
import { Dropdown } from '#/components/ui/Dropdown';
import { Menu, MenuButton, MenuLabel, MenuLink, MenuSeparator } from '#/components/ui/Menu';
import { BrandMark } from './BrandMark';
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

/**
 * The menu of a visitor signed in on a live site. Only what is built: the
 * rest of the mock menu points at pages that do not exist yet.
 */
function LiveUserMenu({ name }: { name: string }) {
  const signOut = useSignOut();

  return (
    <Dropdown
      align="end"
      trigger={
        <button type="button" className="nav-link" aria-label="User menu">
          <Avatar name={name} src={null} />
          <ChevronDown className="dropdown__chevron" size={14} />
        </button>
      }
    >
      <Menu>
        <MenuLabel>{name}</MenuLabel>
        <MenuSeparator />
        <MenuLink href="/settings/account">Account</MenuLink>
        <MenuButton onClick={signOut}>Sign out</MenuButton>
      </Menu>
    </Dropdown>
  );
}

function UserMenu() {
  const user = useCurrentUser();
  const kind = useDataSource();

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
        <Link to="/sessions/new" className="nav-link">
          Login
        </Link>
      </>
    );
  }

  if (kind === 'live') {
    return <LiveUserMenu name={user.name} />;
  }

  return (
    <>
      <Link
        // @ts-expect-error TODO: route not built yet
        to="/notifications"
        className="nav-link nav-link--badged nav__bottom-nav-hidden"
        title="Notifications"
        aria-label="Notifications, 3 new"
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
      <Link to="/filters" className="nav-link" title="Filters" aria-label="Filters">
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
  const site = useSite();
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

          <Link to="/" className="nav-brand" aria-label={`${site.name} home`}>
            <BrandMark />
            <span className="nav-brand__name">{site.name}</span>
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
