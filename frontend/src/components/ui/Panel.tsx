import type { ComponentProps, ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

/**
 * Panel - Philomena's `.block`. The primary content container: a tinted title
 * strip over a body, optionally with tabs and a footer link.
 */
export function Panel({
  className,
  ...props
}: Omit<ComponentProps<'section'>, 'className'> & { className?: ClassValue }) {
  return <section className={cn('panel', className)} {...props} />;
}

interface PanelHeaderProps extends Omit<ComponentProps<'header'>, 'className'> {
  /** Lighter tint, for a second strip nested under the panel title. */
  sub?: boolean;
  center?: boolean;
  className?: ClassValue;
}

export function PanelHeader({ sub = false, center = false, className, ...props }: PanelHeaderProps) {
  return (
    <header
      className={cn('panel-header', sub && 'panel-header--sub', center && 'panel-header--center', className)}
      {...props}
    />
  );
}

interface PanelBodyProps extends Omit<ComponentProps<'div'>, 'className'> {
  /** Drops the padding, for bodies that are a full-bleed list or grid. */
  flush?: boolean;
  className?: ClassValue;
}

export function PanelBody({ flush = false, className, ...props }: PanelBodyProps) {
  return <div className={cn('panel-body', flush && 'panel-body--flush', className)} {...props} />;
}

/** A footer strip. Renders as a link when `href` is given, a plain bar otherwise. */
export function PanelFooter({
  href,
  className,
  children,
}: {
  href?: string;
  className?: ClassValue;
  children: ReactNode;
}) {
  if (href === undefined) {
    return <div className={cn('panel-footer', className)}>{children}</div>;
  }

  return (
    <Link to={href} className={cn('panel-footer', className)}>
      {children}
    </Link>
  );
}

/** Rows inside a flush panel body - comment lists, activity feeds. */
export function PanelList({
  className,
  ...props
}: Omit<ComponentProps<'ul'>, 'className'> & { className?: ClassValue }) {
  return <ul className={cn('panel-list', className)} {...props} />;
}

/**
 * The tab strip. Doubles as the panel's title bar when tabs are present.
 *
 * Owns the arrow-key half of the roving-tabindex pattern, walking the DOM
 * rather than the caller's tab array so any `role="tab"` child participates
 * without being registered.
 */
export function PanelTabs({
  label,
  className,
  children,
}: {
  label: string;
  className?: ClassValue;
  children: ReactNode;
}) {
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) {
      return;
    }

    const tabs = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const from = tabs.indexOf(event.target as HTMLButtonElement);
    const next = tabs[(from + step + tabs.length) % tabs.length];
    if (from === -1 || next === undefined) {
      return;
    }

    event.preventDefault();
    next.focus();
    next.click();
  };

  return (
    <div role="tablist" aria-label={label} className={cn('panel-tabs', className)} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

interface PanelTabProps {
  id: string;
  /** The `id` of the `role="tabpanel"` this tab reveals. */
  controls: string;
  selected: boolean;
  title?: string;
  onSelect: () => void;
  children: ReactNode;
}

export function PanelTab({ id, controls, selected, title, onSelect, children }: PanelTabProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-controls={controls}
      aria-selected={selected}
      // Only the selected tab is in the tab order; arrow keys move between the
      // rest, which is the roving-tabindex pattern `role="tablist"` implies.
      tabIndex={selected ? 0 : -1}
      title={title}
      className="panel-tab"
      onClick={onSelect}
    >
      {children}
    </button>
  );
}
