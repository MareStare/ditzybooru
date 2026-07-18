import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '#/lib/utils';

/** How many numbered page links to show — purely presentational in this mockup. */
const PAGE_COUNT = 5;

interface PaginationProps {
  /** The currently active page. */
  page: number;
  /** Called with the requested page when the user picks a different one. */
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * A compact page navigator. Still fabricated in this mockup — it renders a
 * fixed run of pages and reports clicks via {@link PaginationProps.onPageChange}
 * so each caller can keep its own page state; wire it to the router/API once
 * listing is real.
 */
export function Pagination({ page, onPageChange, className }: PaginationProps) {
  const pages = Array.from({ length: PAGE_COUNT }, (_, i) => i + 1);
  const atStart = page <= 1;

  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)} aria-label="Pagination">
      <button
        type="button"
        disabled={atStart}
        onClick={() => {
          onPageChange(page - 1);
        }}
        aria-label="Previous page"
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors enabled:hover:bg-muted enabled:hover:text-foreground disabled:cursor-not-allowed disabled:text-muted-foreground/50"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map(p => (
        <button
          key={p}
          type="button"
          onClick={() => {
            onPageChange(p);
          }}
          aria-current={p === page ? 'page' : undefined}
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md tabular-nums transition-colors',
            p === page
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {p}
        </button>
      ))}
      <span className="px-1 text-muted-foreground">…</span>
      <button
        type="button"
        onClick={() => {
          onPageChange(page + 1);
        }}
        className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Next
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
