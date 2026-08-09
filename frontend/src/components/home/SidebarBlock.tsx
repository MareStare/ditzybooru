import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

import { Panel, PanelBody, PanelFooter, PanelHeader } from '#/components/ui/Panel';
import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

interface SidebarBlockProps {
  title: string;
  /** Makes the header title a link to this destination. */
  href?: string;
  icon?: ReactNode;
  /** Optional link rendered at the bottom of the block. */
  footer?: { label: string; href: string };
  className?: ClassValue;
  bodyClassName?: ClassValue;
  /** Whether the body keeps the panel's padding. Lists and grids opt out. */
  flush?: boolean;
  children: ReactNode;
}

/**
 * A titled sidebar block, mirroring Philomena's `.block` with a
 * `.block__header--single-item` header and optional footer link. A thin
 * composition over {@link Panel} - it exists to keep the sidebar's five blocks
 * from restating the same header/footer shape.
 */
export function SidebarBlock({
  title,
  href,
  icon,
  footer,
  className,
  bodyClassName,
  flush = true,
  children,
}: SidebarBlockProps) {
  const heading = (
    <>
      {icon}
      {title}
    </>
  );

  return (
    <Panel className={cn(className)}>
      <PanelHeader center>{href === undefined ? heading : <Link to={href}>{heading}</Link>}</PanelHeader>

      <PanelBody flush={flush} className={cn(bodyClassName)}>
        {children}
      </PanelBody>

      {footer ? <PanelFooter href={footer.href}>{footer.label}</PanelFooter> : null}
    </Panel>
  );
}
