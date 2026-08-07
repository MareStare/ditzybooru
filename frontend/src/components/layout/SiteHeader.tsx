import { useState } from 'react';
import { Bell, Camera, ChevronDown, Filter, Mail, Menu as MenuIcon, Search, Upload } from 'lucide-react';

import { Avatar } from '#/components/ui/Avatar';
import { Button } from '#/components/ui/Button';
import { Dropdown } from '#/components/ui/Dropdown';
import { Menu, MenuLink, MenuSeparator } from '#/components/ui/Menu';
import { currentUser } from '#/lib/mock/data';
import { HeaderNav } from './HeaderNav';
import { MobileMenu } from './MobileMenu';
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

function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <form
      // The /search route does not exist in this single-page mockup, so keep
      // the submit on-page. Wire this to the router/API once search lands.
      onSubmit={event => {
        event.preventDefault();
      }}
      className="nav-search"
      role="search"
    >
      <div className="nav-search__box">
        <Search className="nav-search__icon" size={16} />
        <input
          className="field"
          value={query}
          onChange={event => {
            setQuery(event.target.value);
          }}
          placeholder="Search"
          aria-label="Search"
          inputMode="search"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
      <Button type="submit" variant="ghost" icon title="Search" aria-label="Search">
        <Search size={16} />
      </Button>
      <a
        href="/search/reverse"
        title="Search using an image"
        aria-label="Reverse image search"
        className="nav-link nav__compact-hidden"
      >
        <Camera size={16} />
      </a>
    </form>
  );
}

function UserMenu() {
  const user = currentUser;

  if (!user) {
    return (
      <>
        <a href="/registrations/new" className="nav-link nav__compact-hidden">
          Register
        </a>
        <a href="/sessions/new" className="nav-link">
          Login
        </a>
      </>
    );
  }

  return (
    <>
      <a href="/notifications" className="nav-link nav-link--badged" title="Notifications" aria-label="Notifications">
        <Bell size={16} />
        <span className="nav-link__badge">3</span>
      </a>
      <a href="/conversations" className="nav-link" title="Conversations" aria-label="Conversations">
        <Mail size={16} />
      </a>
      <a href="/filters" className="nav-link nav__compact-hidden" title="Filters" aria-label="Filters">
        <Filter size={16} />
      </a>

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
      <div className="nav-bar">
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

        <a href="/" className="nav-brand" aria-label="Home">
          <span className="nav-brand__mark">D</span>
          <span className="nav-brand__name">Ditzybooru</span>
        </a>

        <a href="/images/new" className="nav-link nav__compact-hidden" title="Upload" aria-label="Upload">
          <Upload size={16} />
        </a>

        <SearchBar />

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
