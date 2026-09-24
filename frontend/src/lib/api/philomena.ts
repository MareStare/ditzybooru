/**
 * The Philomena REST API as a {@link DataSource}.
 *
 * Every call is a server function. Philomena sends no
 * `Access-Control-Allow-Origin`, so the browser cannot reach it: page 1 would
 * arrive with the server-rendered document and every step after it would fail
 * on CORS. Going through our own origin also puts one place in front of the
 * upstream for caching and, later, for an API key.
 */

import { createServerFn } from '@tanstack/react-start';

import * as philomena from '#/lib/api/philomena.server';
import type { DataSource, MediaSearchParams } from '#/lib/api/types';

/** Arguments arrive over the wire as `unknown` - the browser is not the only
 *  thing that can call a server function. */
function count(data: unknown, name: string): number {
  if (typeof data !== 'number' || !Number.isInteger(data) || data < 1) {
    throw new Error(`${name} must be a positive integer, got ${JSON.stringify(data)}`);
  }

  return data;
}

function searchParams(data: unknown): MediaSearchParams {
  if (typeof data !== 'object' || data === null) {
    throw new Error(`Search params must be an object, got ${JSON.stringify(data)}`);
  }

  const { query, page, perPage } = data as Record<string, unknown>;
  if (typeof query !== 'string') {
    throw new Error(`Search query must be a string, got ${JSON.stringify(query)}`);
  }

  return { query, page: count(page, 'page'), perPage: count(perPage, 'perPage') };
}

const searchMedia = createServerFn({ method: 'GET' })
  .validator(searchParams)
  .handler(({ data }) => philomena.searchMedia(data));

const featuredMedia = createServerFn({ method: 'GET' }).handler(() => philomena.featuredMedia());

const trendingMedia = createServerFn({ method: 'GET' })
  .validator((data: unknown) => count(data, 'limit'))
  .handler(({ data }) => philomena.trendingMedia(data));

const recentComments = createServerFn({ method: 'GET' })
  .validator((data: unknown) => count(data, 'limit'))
  .handler(({ data }) => philomena.recentComments(data));

export const philomenaSource: DataSource = {
  searchMedia: params => searchMedia({ data: params }),
  featuredMedia: () => featuredMedia(),
  trendingMedia: limit => trendingMedia({ data: limit }),
  recentComments: limit => recentComments({ data: limit }),
};
