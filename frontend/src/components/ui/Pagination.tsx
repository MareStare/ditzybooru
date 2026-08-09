import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

/** How many numbered page links surround the current one. */
const WINDOW_SIZE = 5;

interface PaginationProps {
  /** The currently active page, 1-based. */
  page: number;
  pageCount: number;
  /** Called with the requested page when the user picks a different one. */
  onPageChange: (page: number) => void;
  /**
   * What this navigator pages through. Required because a page may carry more
   * than one, and two `<nav>`s both labelled "Pagination" are indistinguishable
   * to anyone navigating by landmark.
   */
  label: string;
  className?: ClassValue;
}

/**
 * Returns the run of numbered pages to render: `WINDOW_SIZE` of them centred on
 * the current page, slid back inside the range at either end rather than
 * truncated, so the control keeps a constant width while paging.
 */
function pageWindow(page: number, pageCount: number): Array<number> {
  const size = Math.min(WINDOW_SIZE, pageCount);
  const start = Math.min(Math.max(page - Math.floor(size / 2), 1), pageCount - size + 1);

  return Array.from({ length: size }, (_, i) => start + i);
}

/**
 * A page navigator: jump-to-end controls around a sliding window of numbered
 * pages. Purely presentational - it reports clicks via
 * {@link PaginationProps.onPageChange} so each caller keeps its own page state.
 */
export function Pagination({ page, pageCount, onPageChange, label, className }: PaginationProps) {
  const pages = pageWindow(page, pageCount);
  const firstShown = pages[0] ?? 1;
  const lastShown = pages[pages.length - 1] ?? pageCount;
  const atStart = page <= 1;
  const atEnd = page >= pageCount;

  return (
    <nav className={cn('pagination', className)} aria-label={`${label} pages`}>
      <button
        type="button"
        className="page-link page-link--edge"
        disabled={atStart}
        aria-label="First page"
        onClick={() => {
          onPageChange(1);
        }}
      >
        « First
      </button>
      <button
        type="button"
        className="page-link"
        disabled={atStart}
        aria-label="Previous page"
        onClick={() => {
          onPageChange(page - 1);
        }}
      >
        ‹ Prev
      </button>

      {firstShown > 1 ? <span className="page-gap">…</span> : null}

      {pages.map(p => (
        <button
          key={p}
          type="button"
          className="page-link"
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Page ${p}`}
          onClick={() => {
            onPageChange(p);
          }}
        >
          {p}
        </button>
      ))}

      {lastShown < pageCount ? <span className="page-gap">…</span> : null}

      <button
        type="button"
        className="page-link"
        disabled={atEnd}
        aria-label="Next page"
        onClick={() => {
          onPageChange(page + 1);
        }}
      >
        Next ›
      </button>
      <button
        type="button"
        className="page-link page-link--edge"
        disabled={atEnd}
        aria-label="Last page"
        onClick={() => {
          onPageChange(pageCount);
        }}
      >
        Last »
      </button>
    </nav>
  );
}
