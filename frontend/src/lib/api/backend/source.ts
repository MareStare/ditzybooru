/**
 * Our own API as a {@link DataSource}.
 *
 * Read-only and unauthenticated. The upstream applies its anonymous default
 * filter to every search; anything that needs an account is out of reach until
 * sign-in exists.
 */

import { TRENDING_WINDOW, searchSorts } from '#/lib/api/sorts';
import { get } from '#/lib/api/backend/client';
import type { DataSource, MediaPage, MediaSearchParams } from '#/lib/api/types';
import { HttpError } from '#/lib/http/http-client';
import type { Attribution, Comment, ForumTopic, Gallery, LiveStreamChannel, Media, MimeType } from '#/lib/types';

/** The API rejects anything larger. */
const MAX_PER_PAGE = 50;

const MIME_TYPES: Array<MimeType> = ['image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'video/webm'];

/** The API's `Media`: the same as ours, but `mimeType` can be any string. */
type ApiMedia = Omit<Media, 'mimeType'> & { mimeType: string };

interface ApiComment {
  id: number;
  imageId: number;
  createdAt: string;
  author: string;
  avatarUrl: string;
  /** `null` for an anonymous comment. */
  userId: null | number;
  /** `null` when the filter hides the image. */
  imageThumbTiny: null | string;
}

interface Results<TItem> {
  items: Array<TItem>;
  total: number;
}

/**
 * Philomena names every representation of a video `.webm`, which an `<img>`
 * cannot show. The same path with a `.gif` extension is the animated still
 * Derpibooru renders in a grid, and it exists for the thumbnail sizes only -
 * a larger slot has to play the video itself.
 */
function withStills(raw: ApiMedia): Media['representations'] {
  const still = (url: string) => (raw.mimeType === 'video/webm' ? url.replace(/\.webm$/, '.gif') : url);
  const reprs = raw.representations;

  return {
    ...reprs,
    thumb: still(reprs.thumb),
    thumbSmall: still(reprs.thumbSmall),
    thumbTiny: still(reprs.thumbTiny),
  };
}

/**
 * One image, or nothing when the upload is of a kind this frontend has no
 * rendering for. Dropping the odd row keeps a whole page from failing over a
 * media type added upstream after this list was written.
 */
function toMedia(raw: ApiMedia): Array<Media> {
  const mimeType = MIME_TYPES.find(known => known === raw.mimeType);
  if (mimeType === undefined) {
    return [];
  }
  return [{ ...raw, mimeType, representations: withStills(raw) }];
}

function attribution(raw: ApiComment): Attribution {
  if (raw.userId === null) {
    return { user: null, anonymousName: raw.author };
  }
  // The API has no slug, and Philomena's profile URLs accept the name.
  return {
    user: { id: raw.userId, name: raw.author, slug: raw.author, avatarUrl: raw.avatarUrl },
    anonymousName: null,
  };
}

async function searchImages(query: string, page: number, perPage: number, sort?: { sf: string; sd: string }) {
  return get<Results<ApiMedia>>('/search', { q: query, page, perPage: Math.min(perPage, MAX_PER_PAGE), ...sort });
}

async function searchMedia({ query, page, perPage }: MediaSearchParams): Promise<MediaPage> {
  const response = await searchImages(query, page, perPage);
  return { images: response.items.flatMap(toMedia), total: response.total };
}

async function featuredMedia(): Promise<Media> {
  const image = await get<ApiMedia>('/images/featured');
  const [media] = toMedia(image);
  if (media === undefined) {
    throw new Error(`Featured image ${image.id} has unsupported mime type ${image.mimeType}`);
  }
  return media;
}

async function trendingMedia(limit: number): Promise<Array<Media>> {
  const response = await searchImages(TRENDING_WINDOW, 1, limit, searchSorts.wilsonScore);
  return response.items.flatMap(toMedia);
}

async function recentComments(limit: number): Promise<Array<Comment>> {
  const response = await get<Results<ApiComment>>('/comments', {
    q: '*',
    perPage: Math.min(limit, MAX_PER_PAGE),
    ...searchSorts.createdAt,
  });

  return response.items.flatMap(raw =>
    raw.imageThumbTiny === null
      ? []
      : [
          {
            id: raw.id,
            imageId: raw.imageId,
            createdAt: raw.createdAt,
            author: attribution(raw),
            imageThumbTiny: raw.imageThumbTiny,
          },
        ],
  );
}

async function recentTopics(limit: number): Promise<Array<ForumTopic>> {
  const response = await get<{ items: Array<ForumTopic> }>('/forum-activity', {
    limit: Math.min(limit, MAX_PER_PAGE),
  });
  return response.items;
}

interface ApiChannel {
  id: number;
  title: string;
  live: boolean;
  viewers: null | number;
  nsfw: boolean;
}

async function liveStreams(): Promise<Array<LiveStreamChannel> | null> {
  try {
    const response = await get<{ items: Array<ApiChannel> }>('/channels');
    return response.items.map(raw => ({
      id: raw.id,
      title: raw.title,
      isLive: raw.live,
      nsfw: raw.nsfw,
      viewers: raw.viewers ?? 0,
    }));
  } catch (error) {
    // 501: this upstream has no such page (Derpibooru), which is an answer.
    if (error instanceof HttpError && error.response.status === 501) {
      return null;
    }
    throw error;
  }
}

interface ApiGallery {
  id: number;
  title: string;
  description: string;
  user: string;
  imageTotal: number;
  images: Array<ApiMedia>;
}

async function gallery(id: number, page: number, perPage: number): Promise<Gallery> {
  const raw = await get<ApiGallery>(`/galleries/${id}`, { page, perPage: Math.min(perPage, MAX_PER_PAGE) });
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    creator: raw.user,
    imageTotal: raw.imageTotal,
    images: raw.images.flatMap(toMedia),
  };
}

export const apiSource: DataSource = {
  searchMedia,
  featuredMedia,
  trendingMedia,
  recentComments,
  recentTopics,
  liveStreams,
  gallery,
};
