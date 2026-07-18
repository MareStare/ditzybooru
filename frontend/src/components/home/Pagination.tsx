import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '#/lib/utils';

const pages = [1, 2, 3, 4, 5];

/**
 * A compact page navigator. Purely presentational in this mockup (page 1 is
 * always current) — wire it to the router/API once listing is real.
 */
export function Pagination({ className }: { className?: string }) {
  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)} aria-label="Pagination">
      <span className="inline-flex size-7 cursor-not-allowed items-center justify-center rounded-md text-muted-foreground/50">
        <ChevronLeft className="size-4" />
      </span>
      {pages.map(page => (
        <a
          key={page}
          href={`/?page=${String(page)}`}
          aria-current={page === 1 ? 'page' : undefined}
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md tabular-nums transition-colors',
            page === 1
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {page}
        </a>
      ))}
      <span className="px-1 text-muted-foreground">…</span>
      <a
        href="/?page=2"
        className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Next
        <ChevronRight className="size-4" />
      </a>
    </nav>
  );
}
