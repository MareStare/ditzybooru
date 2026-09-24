/**
 * Every query the site runs, as reusable options.
 *
 * The source is part of each key, so flipping the developer setting refetches
 * rather than handing back the other source's answer to the same question.
 */

import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { dataSource } from '#/lib/api';
import type { DataSourceKind, MediaSearchParams } from '#/lib/api/types';

export function mediaSearchQuery(kind: DataSourceKind, params: MediaSearchParams) {
  return queryOptions({
    queryKey: ['media', kind, 'search', params],
    queryFn: () => dataSource(kind).searchMedia(params),
    // A page step or a change of page size keeps the grid that is on screen
    // until the next one arrives, rather than collapsing the page to a spinner.
    placeholderData: keepPreviousData,
  });
}

export function featuredMediaQuery(kind: DataSourceKind) {
  return queryOptions({
    queryKey: ['media', kind, 'featured'],
    queryFn: () => dataSource(kind).featuredMedia(),
  });
}

export function trendingMediaQuery(kind: DataSourceKind, limit: number) {
  return queryOptions({
    queryKey: ['media', kind, 'trending', limit],
    queryFn: () => dataSource(kind).trendingMedia(limit),
  });
}

export function recentCommentsQuery(kind: DataSourceKind, limit: number) {
  return queryOptions({
    queryKey: ['comments', kind, 'recent', limit],
    queryFn: () => dataSource(kind).recentComments(limit),
  });
}
