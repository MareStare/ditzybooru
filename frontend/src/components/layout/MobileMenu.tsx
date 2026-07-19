import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Heart, LogIn, Mail, Radio, Upload, UserPlus, X } from 'lucide-react';

import { primaryNav } from '#/lib/mock/site';
import { currentUser, liveChannelCount } from '#/lib/mock/data';
import { Button } from '#/components/ui/button';
import { Avatar, AvatarFallback } from '#/components/ui/avatar';
import { initials } from '#/lib/format';

const sectionLink = 'block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted';

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

  const overlay = (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 size-full cursor-default bg-black/50 animate-in fade-in"
        onClick={onClose}
      />

      <nav className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto border-r bg-background shadow-xl animate-in slide-in-from-left">
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-3">
          <span className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              D
            </span>
            <span className="text-base font-semibold tracking-tight">Ditzybooru (preview 3)</span>
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close menu">
            <X />
          </Button>
        </div>

        <div className="flex-1 p-2">
          <a href="/images/new" className={sectionLink} onClick={onClose}>
            <Upload className="mr-2 inline size-4" />
            Upload
          </a>
          <a href="/channels" className={sectionLink} onClick={onClose}>
            <Radio className="mr-2 inline size-4 text-green-500" />
            Live
            <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums">{liveChannelCount}</span>
          </a>
          <a href="/pages/donations" className={sectionLink} onClick={onClose}>
            <Heart className="mr-2 inline size-4 text-green-600 dark:text-green-400" />
            Donate
          </a>
          <a href="/pages/contact" className={sectionLink} onClick={onClose}>
            <Mail className="mr-2 inline size-4" />
            Contact
          </a>

          <div className="my-2 h-px bg-border" />

          {primaryNav.map(item => (
            <div key={item.href} className="mb-1">
              <a href={item.href} className={`${sectionLink} font-medium`} onClick={onClose}>
                {item.label}
              </a>
              {item.children?.map(child => (
                <a
                  key={child.href}
                  href={child.href}
                  className="block rounded-md py-1.5 pr-3 pl-9 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={onClose}
                >
                  {child.label}
                </a>
              ))}
            </div>
          ))}

          <div className="my-2 h-px bg-border" />

          {currentUser ? (
            <>
              <a href={`/profiles/${currentUser.slug}`} className={`${sectionLink} font-medium`} onClick={onClose}>
                <Avatar className="mr-2 inline-flex size-6 align-middle">
                  <AvatarFallback>{initials(currentUser.name)}</AvatarFallback>
                </Avatar>
                {currentUser.name}
              </a>
              {accountLinks.map(link => (
                <a key={link.href} href={link.href} className={sectionLink} onClick={onClose}>
                  {link.label}
                </a>
              ))}
            </>
          ) : (
            <>
              <a href="/registrations/new" className={sectionLink} onClick={onClose}>
                <UserPlus className="mr-2 inline size-4" />
                Register
              </a>
              <a href="/sessions/new" className={sectionLink} onClick={onClose}>
                <LogIn className="mr-2 inline size-4" />
                Login
              </a>
            </>
          )}
        </div>
      </nav>
    </div>
  );

  // Portal to <body> so the overlay escapes the header's stacking context and
  // `backdrop-filter` containing block — otherwise `fixed`/`z-50` would be
  // trapped inside the header and sit below the page content.
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
