/**
 * The Philomena REST API as a {@link DataSource}.
 *
 * The server and the browser both call Philomena directly. If the browser call
 * fails, the browser falls back to a server function.
 */

import { createServerFn } from '@tanstack/react-start';

import { directSource } from '#/lib/api/philomena/endpoints';
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
  .handler(({ data }) => directSource.searchMedia(data));

const featuredMedia = createServerFn({ method: 'GET' }).handler(() => directSource.featuredMedia());

const trendingMedia = createServerFn({ method: 'GET' })
  .validator((data: unknown) => count(data, 'limit'))
  .handler(({ data }) => directSource.trendingMedia(data));

const recentComments = createServerFn({ method: 'GET' })
  .validator((data: unknown) => count(data, 'limit'))
  .handler(({ data }) => directSource.recentComments(data));

function withFallback<R>(direct: () => Promise<R>, server: () => Promise<R>): Promise<R> {
  if (import.meta.env.SSR) {
    return direct();
  }

  return direct().catch((error: unknown) => {
    console.warn('The request from the browser failed. Retrying it via the server.', error);
    return server();
  });
}

export const philomenaSource: DataSource = {
  searchMedia: params =>
    withFallback(
      () => directSource.searchMedia(params),
      () => searchMedia({ data: params }),
    ),
  featuredMedia: () =>
    withFallback(
      () => directSource.featuredMedia(),
      () => featuredMedia(),
    ),
  trendingMedia: limit =>
    withFallback(
      () => directSource.trendingMedia(limit),
      () => trendingMedia({ data: limit }),
    ),
  recentComments: limit =>
    withFallback(
      () => directSource.recentComments(limit),
      () => recentComments({ data: limit }),
    ),
};
