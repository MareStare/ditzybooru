import { useLayoutEffect, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';

import { MediaGrid, SEARCH_RESULTS_TRANSITION } from '#/components/home/MediaGrid';
import { unwrap } from '#/lib/assertions';
import { images, totalImages } from '#/lib/mock/data';
import { scrollToTopOf } from '#/lib/motion';

/** The search this page ran. `*` is every image, as in Philomena. */
export interface SearchParams {
  q: string;
  page: number;
}

function pageParam(value: unknown): number {
  const page = Number(value);

  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export const Route = createFileRoute('/search')({
  component: SearchPage,
  // Hand-written rather than schema-validated: two params, and a bad one has an
  // obvious sane reading rather than an error to report.
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === 'string' ? search.q : '*',
    page: pageParam(search.page),
  }),
});

function SearchPage() {
  const { q, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const grid = useRef<HTMLElement>(null);
  const paged = useRef(false);

  // Paging always puts the first result back under the reader's eye. Instant on
  // arrival, since the route's own transition just carried them here; animated
  // for every page picked on this page.
  useLayoutEffect(() => {
    const panel = unwrap(grid.current);
    void scrollToTopOf(panel, { animate: paged.current });
    if (!paged.current) {
      panel.focus({ preventScroll: true });
    }
    paged.current = true;
  }, [page]);

  return (
    <div className="search-page">
      <MediaGrid
        ref={grid}
        headingLevel={1}
        size="large"
        label={q === '*' ? 'Search results' : `Results for ${q}`}
        icon={<Search size={16} />}
        images={images}
        total={totalImages}
        viewTransitionName={SEARCH_RESULTS_TRANSITION}
        paging={{
          page,
          onPageChange: nextPage => {
            // `resetScroll` off because the effect above owns where the reader
            // lands, and the router's jump to 0 would fight it.
            void navigate({ search: prev => ({ ...prev, page: nextPage }), resetScroll: false });
          },
        }}
      />
    </div>
  );
}
