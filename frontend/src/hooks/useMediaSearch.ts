import { useQuery } from '@tanstack/react-query';

import { useComponentSettings } from '#/hooks/useComponentSettings';
import { useDataSource } from '#/hooks/useDataSource';
import { useDebounced } from '#/hooks/useDebounced';
import { mediaSearchQuery } from '#/lib/api/queries';
import type { MediaPage } from '#/lib/api/types';

/** How long the page-size slider has to sit still before the grid asks the
 *  origin for a page of that size. */
const PER_PAGE_SETTLE_MS = 400;

const EMPTY_PAGE: MediaPage = { images: [], total: 0 };

/** A page of search results, refetched when the reader pages or resizes the
 *  grid. The route loader has already filled the page it was entered on. */
export function useMediaSearch(query: string, page: number): MediaPage {
  const kind = useDataSource();
  const { mediaPerPage } = useComponentSettings();
  const perPage = useDebounced(mediaPerPage, PER_PAGE_SETTLE_MS);

  const { data } = useQuery(mediaSearchQuery(kind, { query, page, perPage }));

  return data ?? EMPTY_PAGE;
}
