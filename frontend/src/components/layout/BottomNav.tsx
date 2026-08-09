import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell, Mail, Search, X } from 'lucide-react';

import { currentUser } from '#/lib/mock/data';
import { SearchBar } from './SearchBar';

/**
 * The phone-sized navigation bar, pinned to the bottom of the viewport. It
 * carries the three destinations that are worth a thumb - search,
 * notifications, conversations - which the top bar gives up at this width.
 *
 * Search is a sheet rather than a link: the field it opens is the same one the
 * header renders on a wide screen, so searching stays a thing you do in place
 * rather than a page you navigate to.
 */
export function BottomNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [searchOpen]);

  const user = currentUser;

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {searchOpen ? (
        <div className="bottom-nav__sheet">
          <SearchBar inputRef={inputRef} />
        </div>
      ) : null}

      <div className="bottom-nav__bar">
        <button
          type="button"
          className="bottom-nav__item"
          aria-expanded={searchOpen}
          onClick={() => {
            setSearchOpen(open => !open);
          }}
        >
          {searchOpen ? <X size={20} /> : <Search size={20} />}
          {searchOpen ? 'Close' : 'Search'}
        </button>

        {user ? (
          <>
            <Link
              // @ts-expect-error TODO: route not built yet
              to="/notifications"
              className="bottom-nav__item"
            >
              <span className="bottom-nav__icon">
                <Bell size={20} />
                <span className="bottom-nav__badge">3</span>
              </span>
              Notifications
            </Link>
            <Link
              // @ts-expect-error TODO: route not built yet
              to="/conversations"
              className="bottom-nav__item"
            >
              <Mail size={20} />
              Conversations
            </Link>
          </>
        ) : null}
      </div>
    </nav>
  );
}
