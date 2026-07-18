import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

import { cn } from '#/lib/utils';

interface SidebarBlockProps {
  title: string;
  /** Makes the header title a link to this destination. */
  href?: string;
  icon?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * A titled sidebar block, mirroring Philomena's `.block` with a
 * `.block__header--single-item` header and optional footer link.
 */
export function SidebarBlock({ title, href, icon, className, bodyClassName, children }: SidebarBlockProps) {
  const heading = (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {title}
    </span>
  );

  return (
    <section className={cn('overflow-hidden rounded-xl border bg-card', className)}>
      <div className="border-b px-3 py-2 text-sm font-semibold">
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
    </section>
  );
}
