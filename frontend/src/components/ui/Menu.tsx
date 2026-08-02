import type { ComponentProps, ReactNode } from 'react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

/** The menu surface: a raised list of actions or links. */
export function Menu({ className, ...props }: Omit<ComponentProps<'ul'>, 'className'> & { className?: ClassValue }) {
  return <ul className={cn('menu', className)} {...props} />;
}

/** A section title inside a menu. Not focusable, not an option. */
export function MenuLabel({ children }: { children: ReactNode }) {
  return <li className="menu-label">{children}</li>;
}

export function MenuSeparator() {
  // No `role="presentation"` on the `<li>`: stripping its listitem role makes
  // the parent `<ul>` a list with a non-list child, which is a real defect.
  return (
    <li>
      <hr className="menu-separator" />
    </li>
  );
}

interface MenuEntryProps {
  /** Renders the entry as the current choice. */
  selected?: boolean;
  className?: ClassValue;
  children: ReactNode;
}

export function MenuLink({
  href,
  selected = false,
  className,
  children,
  onClick,
}: MenuEntryProps & { href: string; onClick?: () => void }) {
  return (
    <li>
      <a
        href={href}
        className={cn('menu-item', selected && 'menu-item--selected', className)}
        aria-current={selected ? 'true' : undefined}
        onClick={onClick}
      >
        {children}
      </a>
    </li>
  );
}

export function MenuButton({
  selected = false,
  disabled = false,
  title,
  className,
  children,
  onClick,
}: MenuEntryProps & { disabled?: boolean; title?: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        className={cn('menu-item', selected && 'menu-item--selected', className)}
        // `aria-pressed`, not `aria-selected`: the latter is only valid on a
        // handful of roles, and a plain button is not one of them.
        aria-pressed={selected}
        disabled={disabled}
        title={title}
        onClick={onClick}
      >
        {children}
      </button>
    </li>
  );
}
