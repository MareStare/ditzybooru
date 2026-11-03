/**
 * Every query the site runs, as reusable options.
 *
 * The source is part of each key, so flipping the developer setting refetches
 * rather than handing back the other source's answer to the same question.
 */

import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { dataSource } from '#/lib/api';
import {
  fetchFilter,
  fetchForum,
  fetchSystemFilters,
  fetchForums,
  fetchTag,
  fetchForumTopics,
  fetchImageActivity,
  fetchImageComments,
  fetchImagePage,
  fetchRules,
  fetchStaff,
  fetchStaticPage,
  fetchTopicPage,
} from '#/lib/api/backend/content';
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

export function recentTopicsQuery(kind: DataSourceKind, limit: number) {
  return queryOptions({
    queryKey: ['forums', kind, 'recent-topics', limit],
    queryFn: () => dataSource(kind).recentTopics(limit),
  });
}

export function liveStreamsQuery(kind: DataSourceKind) {
  return queryOptions({
    queryKey: ['channels', kind],
    queryFn: () => dataSource(kind).liveStreams(),
  });
}

export function galleryQuery(kind: DataSourceKind, id: number, page: number, perPage: number) {
  return queryOptions({
    queryKey: ['galleries', kind, id, page, perPage],
    queryFn: () => dataSource(kind).gallery(id, page, perPage),
    placeholderData: keepPreviousData,
  });
}

/** `signedInAs` tells one visitor's key from another's, so a new key never shows the old one's images. */
export function watchedMediaQuery(kind: DataSourceKind, limit: number, signedInAs: string) {
  return queryOptions({
    queryKey: ['media', kind, 'watched', signedInAs, limit],
    queryFn: () => dataSource(kind).watchedMedia(limit),
  });
}

/*
 * Pages that exist only on the live source: the site's own content, which has
 * no mock. They are keyed by nothing but what they ask for.
 */

export function staticPageQuery(slug: string) {
  return queryOptions({ queryKey: ['content', 'page', slug], queryFn: () => fetchStaticPage(slug) });
}

export function rulesQuery() {
  return queryOptions({ queryKey: ['content', 'rules'], queryFn: fetchRules });
}

export function staffQuery() {
  return queryOptions({ queryKey: ['content', 'staff'], queryFn: fetchStaff });
}

export function tagQuery(slug: string) {
  return queryOptions({ queryKey: ['content', 'tag', slug], queryFn: () => fetchTag(slug) });
}

export function systemFiltersQuery() {
  return queryOptions({ queryKey: ['content', 'filters', 'system'], queryFn: fetchSystemFilters });
}

export function filterQuery(id: number) {
  return queryOptions({ queryKey: ['content', 'filter', id], queryFn: () => fetchFilter(id) });
}

export function forumsQuery() {
  return queryOptions({ queryKey: ['content', 'forums'], queryFn: fetchForums });
}

export function forumQuery(slug: string) {
  return queryOptions({ queryKey: ['content', 'forum', slug], queryFn: () => fetchForum(slug) });
}

export function forumTopicsQuery(slug: string, page: number, perPage: number) {
  return queryOptions({
    queryKey: ['content', 'forum', slug, 'topics', page, perPage],
    queryFn: () => fetchForumTopics(slug, page, perPage),
    placeholderData: keepPreviousData,
  });
}

export function topicPageQuery(forum: string, topic: string, page: number) {
  return queryOptions({
    queryKey: ['content', 'topic', forum, topic, page],
    queryFn: () => fetchTopicPage(forum, topic, page),
    placeholderData: keepPreviousData,
  });
}

export function imagePageQuery(id: number) {
  return queryOptions({ queryKey: ['content', 'image', id], queryFn: () => fetchImagePage(id) });
}

export function imageCommentsQuery(id: number, page: number) {
  return queryOptions({
    queryKey: ['content', 'image', id, 'comments', page],
    queryFn: () => fetchImageComments(id, page),
    placeholderData: keepPreviousData,
  });
}

/** What the visitor has done to an image. Browser only: it needs their cookie. */
export function imageActivityQuery(id: number) {
  return queryOptions({ queryKey: ['session', 'image', id], queryFn: () => fetchImageActivity(id) });
}
