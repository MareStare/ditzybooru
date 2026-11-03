import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@tanstack/react-router';
import { ChevronDown, Heart, LogIn, Mail, SlidersHorizontal, Upload, UserPlus, UserRound, X } from 'lucide-react';

import { Avatar } from '#/components/ui/Avatar';
import { Button } from '#/components/ui/Button';
import { useCurrentUser } from '#/hooks/use-current-user';
import { useDataSource } from '#/hooks/use-data-source';
import { useSignOut } from '#/hooks/use-session';
import { useSite } from '#/hooks/use-site';
import { primaryNav } from '#/lib/mock/site';
import { BrandMark } from './BrandMark';
import { DisplaySettingsControls } from './DisplaySettings';

const accountLinks: Array<{ label: string; href: string }> = [
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
 * Slide-in navigation drawer for small screens, revealed by the header burger
 * button. Mirrors Philomena's `#burger` mobile menu.
 */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  // Close on Escape and lock body scroll while the drawer is open.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const user = useCurrentUser();
  const kind = useDataSource();
  const signOut = useSignOut();
  const site = useSite();

  const overlay = (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button type="button" aria-label="Close menu" className="drawer__scrim" onClick={onClose} />

      <nav className="drawer__panel">
        <div className="drawer__head">
          <span className="nav-brand">
            <BrandMark />
            <span className="nav-brand__name">{site.name}</span>
          </span>
          <Button variant="ghost" icon onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </Button>
        </div>

        <div className="drawer__body">
          <Link
            // @ts-expect-error TODO: route not built yet
            to="/images/new"
            className="drawer__link"
            onClick={onClose}
          >
            <Upload size={16} />
            Upload
          </Link>
          <Link
            // @ts-expect-error TODO: route not built yet
            to="/pages/donations"
            className="drawer__link drawer__link--donate"
            onClick={onClose}
          >
            <Heart size={16} />
            Donate
          </Link>
          <Link
            // @ts-expect-error TODO: route not built yet
            to="/pages/contact"
            className="drawer__link"
            onClick={onClose}
          >
            <Mail size={16} />
            Contact
          </Link>

          <hr className="drawer__separator" />

          {primaryNav.map(item => (
            <div key={item.href} className="drawer__group">
              <Link to={item.href} className="drawer__link drawer__link--section" onClick={onClose}>
                <item.icon size={16} />
                {item.label}
                {item.counter === undefined ? null : <span className="drawer__count">{item.counter}</span>}
              </Link>
              {item.children?.map(child => (
                <Link key={child.href} to={child.href} className="drawer__link drawer__link--child" onClick={onClose}>
                  {child.label}
                </Link>
              ))}
            </div>
          ))}

          <hr className="drawer__separator" />

          {user ? (
            <>
              {kind === 'live' ? (
                <>
                  <span className="drawer__link drawer__link--section">
                    <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                    {user.name}
                  </span>
                  <Link to="/settings/account" className="drawer__link" onClick={onClose}>
                    Account
                  </Link>
                  <button
                    type="button"
                    className="drawer__link"
                    onClick={() => {
                      signOut();
                      onClose();
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/profiles/$slug"
                    params={{ slug: user.slug }}
                    className="drawer__link drawer__link--section"
                    onClick={onClose}
                  >
                    <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                    {user.name}
                  </Link>
                  {accountLinks.map(link => (
                    <Link key={link.href} to={link.href} className="drawer__link" onClick={onClose}>
                      {link.label}
                    </Link>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              <Link
                // @ts-expect-error TODO: route not built yet
                to="/registrations/new"
                className="drawer__link"
                onClick={onClose}
              >
                <UserPlus size={16} />
                Register
              </Link>
              <Link to="/sessions/new" className="drawer__link" onClick={onClose}>
                <LogIn size={16} />
                Login
              </Link>
            </>
          )}

          <hr className="drawer__separator" />

          {/* The display controls live here on a phone rather than in the
              header: the bar has no room for a panel wide enough to hold them.
              Collapsed, because expanded they are taller than the navigation
              they are appended to - which is what the drawer is for. */}
          <details className="drawer__settings">
            <summary className="drawer__settings-summary">
              <span className="drawer__settings-title">Display</span>
              <ChevronDown className="drawer__settings-chevron" size={16} aria-hidden="true" />
            </summary>
            <div className="drawer__settings-content">
              <DisplaySettingsControls />
              <Link to="/settings/display" className="drawer__link" onClick={onClose}>
                <SlidersHorizontal size={16} />
                More settings
              </Link>
              <Link to="/settings/account" className="drawer__link" onClick={onClose}>
                <UserRound size={16} />
                Account
              </Link>
            </div>
          </details>
        </div>
      </nav>
    </div>
  );

  // Portal to <body> so the overlay escapes the header's stacking context -
  // otherwise the fixed positioning would be trapped inside the sticky header
  // and sit below the page content.
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
