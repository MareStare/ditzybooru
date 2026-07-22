import { useState } from 'react';
import { Bell, Camera, ChevronDown, Filter, Menu, MessageSquare, Search, Upload } from 'lucide-react';

import { Avatar, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { currentUser } from '#/lib/mock/data';
import { initials } from '#/lib/format';
import { cn } from '#/lib/utils';
import { HeaderNav } from './HeaderNav';
import { MobileMenu } from './MobileMenu';
import { ThemeColorSwitcher } from './ThemeColorSwitcher';
import { ThemeLightnessToggle } from './ThemeLightnessToggle';

const headerLink =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-primary-nav-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-nav-foreground';

// Ghost buttons rendered on the dark top bar need their light hover swapped for
// a translucent-white one so it reads against the charcoal in both light and dark.
const primaryNavGhost =
  'text-primary-nav-foreground/85 hover:bg-white/10 hover:text-primary-nav-foreground dark:hover:bg-white/10 dark:hover:text-primary-nav-foreground';

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
      className="flex min-w-0 flex-1 items-center gap-1"
      role="search"
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-white/55" />
        <Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search"
          aria-label="Search"
          inputMode="search"
          autoCapitalize="none"
          spellCheck={false}
          className="border-white/15 bg-white/10 pl-8 text-white placeholder:text-white/55 focus-visible:border-white/40 dark:bg-white/10"
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        size="icon"
        title="Search"
        aria-label="Search"
        className="border border-white/15 bg-white/10 text-primary-nav-foreground hover:bg-white/20"
      >
        <Search />
      </Button>
      <a
        href="/search/reverse"
        title="Search using an image"
        aria-label="Reverse image search"
        className="hidden sm:inline-flex"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Search using an image"
          tabIndex={-1}
          className={primaryNavGhost}
        >
          <Camera />
        </Button>
      </a>
    </form>
  );
}

function UserMenu() {
  if (!currentUser) {
    return (
      <div className="flex items-center gap-1">
        <a href="/registrations/new" className={cn(headerLink, 'hidden sm:inline-flex')}>
          Register
        </a>
        <a href="/sessions/new" className={headerLink}>
          Login
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <a href="/notifications" className={`${headerLink} relative`} title="Notifications" aria-label="Notifications">
        <Bell className="size-4" />
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
          3
        </span>
      </a>
      <a href="/conversations" className={headerLink} title="Conversations" aria-label="Conversations">
        <MessageSquare className="size-4" />
      </a>
      <a href="/filters" className={cn(headerLink, 'hidden lg:inline-flex')} title="Filters">
        <Filter className="size-4" />
        <span className="hidden xl:inline">Filters</span>
      </a>

      <div className="group relative ml-1">
        <button
          type="button"
          className="flex items-center gap-1 rounded-md p-0.5 transition-colors hover:bg-white/10"
          aria-label="User menu"
        >
          <Avatar className="size-7">
            {/* The topbar is a fixed dark charcoal, so the default muted fallback
             * blends into it in dark mode. Use the contrast-paired accent tokens
             * (matching the logo badge) so the PFP reads clearly in both themes. */}
            <AvatarFallback className="bg-primary text-primary-foreground">{initials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <ChevronDown className="size-3.5 text-primary-nav-foreground/60" />
        </button>
        <div className="invisible absolute right-0 top-full z-30 mt-1 min-w-48 rounded-lg border bg-popover p-1 opacity-0 shadow-lg transition-[opacity,transform] duration-150 -translate-y-1 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <a
            href={`/profiles/${currentUser.slug}`}
            className="block rounded-md px-3 py-1.5 text-sm font-semibold text-popover-foreground hover:bg-muted"
          >
            {currentUser.name}
          </a>
          <div className="my-1 h-px bg-border" />
          {userMenuLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-1.5 text-sm text-popover-foreground transition-colors hover:bg-muted"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The sticky application header: logo, search and user actions + nav bar. */
export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/25 bg-primary-nav text-primary-nav-foreground">
      <div className="flex h-14 items-center gap-2 px-3 md:gap-3 md:px-4">
        <Button
          variant="ghost"
          size="icon"
          className={cn('md:hidden', primaryNavGhost)}
          aria-label="Open menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => {
            setMobileMenuOpen(true);
          }}
        >
          <Menu />
        </Button>

        <a href="/" className="flex shrink-0 items-center gap-2" aria-label="Home">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            D
          </span>
          <span className="hidden text-base font-semibold tracking-tight sm:inline">Ditzybooru</span>
        </a>

        <a href="/images/new" className={cn(headerLink, 'hidden shrink-0 sm:inline-flex')} title="Upload">
          <Upload className="size-4" />
        </a>

        <SearchBar />

        <div className="flex shrink-0 items-center gap-0.5">
          <ThemeColorSwitcher />
          <ThemeLightnessToggle />
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
