/**
 * Every query the site runs, as reusable options.
 *
 * The source is part of each key, so flipping the developer setting refetches
 * rather than handing back the other source's answer to the same question.
 */

import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';

import { dataSource } from '#/lib/api';
import { takeFailedOnServer } from '#/lib/api/ssr-failures';
import type { DataSource, DataSourceKind, MediaSearchParams } from '#/lib/api/types';

/** A query that failed during SSR does not go to the server again. */
function source(kind: DataSourceKind, queryKey: QueryKey): DataSource {
  return dataSource(kind, !takeFailedOnServer(queryKey));
}

export function mediaSearchQuery(kind: DataSourceKind, params: MediaSearchParams) {
  return queryOptions({
    queryKey: ['media', kind, 'search', params],
    queryFn: ({ queryKey }) => source(kind, queryKey).searchMedia(params),
    // A page step or a change of page size keeps the grid that is on screen
    // until the next one arrives, rather than collapsing the page to a spinner.
    placeholderData: keepPreviousData,
  });
}

export function featuredMediaQuery(kind: DataSourceKind) {
  return queryOptions({
    queryKey: ['media', kind, 'featured'],
    queryFn: ({ queryKey }) => source(kind, queryKey).featuredMedia(),
  });
}

export function trendingMediaQuery(kind: DataSourceKind, limit: number) {
  return queryOptions({
    queryKey: ['media', kind, 'trending', limit],
    queryFn: ({ queryKey }) => source(kind, queryKey).trendingMedia(limit),
  });
}

export function recentCommentsQuery(kind: DataSourceKind, limit: number) {
  return queryOptions({
    queryKey: ['comments', kind, 'recent', limit],
    queryFn: ({ queryKey }) => source(kind, queryKey).recentComments(limit),
  });
}
