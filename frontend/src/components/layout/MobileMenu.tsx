import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Heart, LogIn, Mail, Radio, Upload, UserPlus, X } from 'lucide-react';

import { Avatar } from '#/components/ui/Avatar';
import { Button } from '#/components/ui/Button';
import { primaryNav } from '#/lib/mock/site';
import { currentUser, liveChannelCount } from '#/lib/mock/data';

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

  const user = currentUser;

  const overlay = (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button type="button" aria-label="Close menu" className="drawer__scrim" onClick={onClose} />

      <nav className="drawer__panel">
        <div className="drawer__head">
          <span className="nav-brand">
            <span className="nav-brand__mark">D</span>
            <span className="nav-brand__name">Ditzybooru</span>
          </span>
          <Button variant="ghost" icon onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </Button>
        </div>

        <div className="drawer__body">
          <a href="/images/new" className="drawer__link" onClick={onClose}>
            <Upload size={16} />
            Upload
          </a>
          <a href="/channels" className="drawer__link drawer__link--live" onClick={onClose}>
            <Radio size={16} />
            Live
            <span className="drawer__count">{liveChannelCount}</span>
          </a>
          <a href="/pages/donations" className="drawer__link drawer__link--donate" onClick={onClose}>
            <Heart size={16} />
            Donate
          </a>
          <a href="/pages/contact" className="drawer__link" onClick={onClose}>
            <Mail size={16} />
            Contact
          </a>

          <hr className="drawer__separator" />

          {primaryNav.map(item => (
            <div key={item.href} className="drawer__group">
              <a href={item.href} className="drawer__link drawer__link--section" onClick={onClose}>
                {item.label}
              </a>
              {item.children?.map(child => (
                <a key={child.href} href={child.href} className="drawer__link drawer__link--child" onClick={onClose}>
                  {child.label}
                </a>
              ))}
            </div>
          ))}

          <hr className="drawer__separator" />

          {user ? (
            <>
              <a href={`/profiles/${user.slug}`} className="drawer__link drawer__link--section" onClick={onClose}>
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                {user.name}
              </a>
              {accountLinks.map(link => (
                <a key={link.href} href={link.href} className="drawer__link" onClick={onClose}>
                  {link.label}
                </a>
              ))}
            </>
          ) : (
            <>
              <a href="/registrations/new" className="drawer__link" onClick={onClose}>
                <UserPlus size={16} />
                Register
              </a>
              <a href="/sessions/new" className="drawer__link" onClick={onClose}>
                <LogIn size={16} />
                Login
              </a>
            </>
          )}
        </div>
      </nav>
    </div>
  );

  // Portal to <body> so the overlay escapes the header's stacking context —
  // otherwise the fixed positioning would be trapped inside the sticky header
  // and sit below the page content.
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
