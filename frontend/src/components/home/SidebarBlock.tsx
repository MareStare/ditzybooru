import type { ReactNode } from 'react';

import { cn } from '#/lib/utils';

interface SidebarBlockProps {
  title: string;
  /** Makes the header title a link to this destination. */
  href?: string;
  icon?: ReactNode;
  /** Optional link rendered at the bottom of the block. */
  footer?: { label: string; href: string };
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * A titled sidebar block, mirroring Philomena's `.block` with a
 * `.block__header--single-item` header and optional footer link.
 */
export function SidebarBlock({ title, href, icon, footer, className, bodyClassName, children }: SidebarBlockProps) {
  const heading = (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {title}
    </span>
  );

  return (
    <section className={cn('overflow-hidden rounded-xl bg-card', className)}>
      <div className="px-3 py-2 text-sm font-semibold">
        {href ? (
          <a
            href={href}
            className="flex items-center justify-center text-foreground transition-colors hover:text-primary"
          >
            {heading}
          </a>
        ) : (
          heading
        )}
      </div>

      <div className={bodyClassName}>{children}</div>

      {footer ? (
        <a
          href={footer.href}
          className="block border-t px-3 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {footer.label}
        </a>
      ) : null}
    </section>
  );
}
