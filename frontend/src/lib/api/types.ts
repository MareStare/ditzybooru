/**
 * The shape every data source answers in.
 *
 * The site renders `lib/types` and nothing else, so a source's only job is to
 * produce those. That is what lets the mock and the real API be swapped under
 * a running page without a component knowing which one it got.
 */

import type { Comment, Media } from '#/lib/types';

/** Which backend the site reads from. */
export type DataSourceKind = 'live' | 'mock';

export const DATA_SOURCE_KINDS: Array<DataSourceKind> = ['live', 'mock'];

export interface MediaPage {
  images: Array<Media>;
  /** How many images the query matches across every page. */
  total: number;
}

export interface MediaSearchParams {
  /** A Philomena search query. `*` is every image. */
  query: string;
  page: number;
  perPage: number;
}

export interface DataSource {
  searchMedia: (params: MediaSearchParams) => Promise<MediaPage>;
  featuredMedia: () => Promise<Media>;
  /** Top scoring images of the last few days, for the "Trending" block. */
  trendingMedia: (limit: number) => Promise<Array<Media>>;
  recentComments: (limit: number) => Promise<Array<Comment>>;
}
