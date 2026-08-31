import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';

import { MediaGrid, SEARCH_RESULTS_ID, SEARCH_RESULTS_TRANSITION } from '#/components/home/MediaGrid';
import { images, totalImages } from '#/lib/mock/data';

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

  return (
    <div className="search-page">
      <MediaGrid
        id={SEARCH_RESULTS_ID}
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
            // The hash is what puts the first result back under the reader's
            // eye: the router scrolls to it before paint, on a cold load and
            // on a page click alike.
            void navigate({
              search: prev => ({ ...prev, page: nextPage }),
              hash: SEARCH_RESULTS_ID,
            });
          },
        }}
      />
    </div>
  );
}
