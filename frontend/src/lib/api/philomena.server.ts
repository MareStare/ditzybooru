/**
 * A client for the Philomena REST API.
 *
 * Read-only and unauthenticated. The origin applies its anonymous default
 * filter to every search, and anything that needs an account - faves, watched
 * tags, votes - is out of reach until sign-in exists.
 *
 * Server-only. Philomena sends no `Access-Control-Allow-Origin`, so a browser
 * blocks these requests. `philomena.ts` exposes the same calls to the browser
 * over server functions.
 */

import type { Attribution, Comment, Media, MediaReprs, MimeType } from '#/lib/types';
import type { MediaPage, MediaSearchParams } from '#/lib/api/types';
import { TRENDING_WINDOW, searchSorts } from '#/lib/api/sorts';

/** The Philomena server the site reads from. TODO: make this configurable so
 *  the frontend can be self-hosted against another instance. */
const API_ORIGIN = 'https://derpibooru.org';

/** Philomena rejects anything larger. */
const MAX_PER_PAGE = 50;

interface RawReprs {
  full: string;
  tall: string;
  large: string;
  medium: string;
  small: string;
  thumb: string;
  thumb_small: string;
  thumb_tiny: string;
}

interface RawImage {
  id: number;
  created_at: string;
  width: number;
  height: number;
  aspect_ratio: number;
  mime_type: string;
  tags: Array<string>;
  tag_count: number;
  score: number;
  upvotes: number;
  downvotes: number;
  faves: number;
  comment_count: number;
  source_urls: Array<string>;
  representations: RawReprs;
  spoilered: boolean;
  hidden_from_users: boolean;
}

interface RawComment {
  id: number;
  image_id: number;
  created_at: string;
  author: string;
  avatar: string;
  /** `null` when the comment was posted anonymously. */
  user_id: null | number;
}

type QueryParams = Record<string, number | string>;

class PhilomenaError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`Philomena API request to ${path} failed with status ${status}`);
    this.name = 'PhilomenaError';
  }
}

async function get<TResponse>(path: string, params: QueryParams): Promise<TResponse> {
  const url = new URL(`/api/v1/json/${path}`, API_ORIGIN);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new PhilomenaError(response.status, path);
  }

  return (await response.json()) as TResponse;
}

const MIME_TYPES: Array<MimeType> = ['image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'video/webm'];

/**
 * Philomena names every representation of a video `.webm`, which an `<img>`
 * cannot show. The same path with a `.gif` extension is the animated still
 * Derpibooru renders in a grid, and it exists for the thumbnail sizes only -
 * a larger slot has to play the video itself.
 */
function representations(raw: RawImage): MediaReprs {
  const still = (url: string) => (raw.mime_type === 'video/webm' ? url.replace(/\.webm$/, '.gif') : url);
  const reprs = raw.representations;

  return {
    full: reprs.full,
    tall: reprs.tall,
    large: reprs.large,
    medium: reprs.medium,
    small: reprs.small,
    thumb: still(reprs.thumb),
    thumbSmall: still(reprs.thumb_small),
    thumbTiny: still(reprs.thumb_tiny),
  };
}

/**
 * One image, or nothing when the upload is of a kind this frontend has no
 * rendering for. Dropping the odd row keeps a whole page from failing over a
 * media type added upstream after this list was written.
 */
function toMedia(raw: RawImage): Array<Media> {
  const mimeType = MIME_TYPES.find(known => known === raw.mime_type);
  if (mimeType === undefined) {
    return [];
  }

  return [
    {
      id: raw.id,
      createdAt: raw.created_at,
      width: raw.width,
      height: raw.height,
      aspectRatio: raw.aspect_ratio,
      mimeType,
      tags: raw.tags,
      tagCount: raw.tag_count,
      score: raw.score,
      upvotes: raw.upvotes,
      downvotes: raw.downvotes,
      faves: raw.faves,
      commentCount: raw.comment_count,
      sourceUrls: raw.source_urls,
      representations: representations(raw),
      spoilered: raw.spoilered,
      hiddenFromUsers: raw.hidden_from_users,
    },
  ];
}

/** The API names an author and, for a registered one, an id. There is no slug
 *  in the response, and Philomena's profile URLs accept the name. */
function attribution(raw: RawComment): Attribution {
  if (raw.user_id === null) {
    return { user: null, anonymousName: raw.author };
  }

  return {
    user: { id: raw.user_id, name: raw.author, slug: raw.author, avatarUrl: raw.avatar },
    anonymousName: null,
  };
}

interface ImageSearchResponse {
  total: number;
  images: Array<RawImage>;
}

async function searchImages(params: QueryParams): Promise<ImageSearchResponse> {
  return get<ImageSearchResponse>('search/images', params);
}

export async function searchMedia({ query, page, perPage }: MediaSearchParams): Promise<MediaPage> {
  const response = await searchImages({ q: query, page, per_page: Math.min(perPage, MAX_PER_PAGE) });

  return { images: response.images.flatMap(toMedia), total: response.total };
}

export async function featuredMedia(): Promise<Media> {
  const { image } = await get<{ image: RawImage }>('images/featured', {});
  const [media] = toMedia(image);
  if (media === undefined) {
    throw new Error(`Featured image ${image.id} has unsupported mime type ${image.mime_type}`);
  }

  return media;
}

export async function trendingMedia(limit: number): Promise<Array<Media>> {
  const response = await searchImages({
    q: TRENDING_WINDOW,
    per_page: limit,
    sf: searchSorts.wilsonScore.sf,
    sd: searchSorts.wilsonScore.sd,
  });

  return response.images.flatMap(toMedia);
}

/**
 * The tiny thumbnail of every given image, keyed by id.
 *
 * The comment endpoint reports only which image a comment is on, so the strip's
 * thumbnails take a second request. One `id:a || id:b` search covers the whole
 * batch; an image the filter hides is simply absent from the result.
 */
async function thumbTinyByImageId(imageIds: Array<number>): Promise<Map<number, string>> {
  if (imageIds.length === 0) {
    return new Map();
  }

  const response = await searchImages({
    q: imageIds.map(id => `id:${id}`).join(' || '),
    per_page: Math.min(imageIds.length, MAX_PER_PAGE),
  });

  return new Map(response.images.map(image => [image.id, representations(image).thumbTiny]));
}

export async function recentComments(limit: number): Promise<Array<Comment>> {
  const { comments } = await get<{ comments: Array<RawComment> }>('search/comments', {
    q: '*',
    per_page: limit,
    sf: searchSorts.createdAt.sf,
    sd: searchSorts.createdAt.sd,
  });

  const thumbs = await thumbTinyByImageId([...new Set(comments.map(comment => comment.image_id))]);

  return comments.flatMap(raw => {
    const imageThumbTiny = thumbs.get(raw.image_id);
    if (imageThumbTiny === undefined) {
      return [];
    }

    return [
      {
        id: raw.id,
        imageId: raw.image_id,
        createdAt: raw.created_at,
        author: attribution(raw),
        imageThumbTiny,
      },
    ];
  });
}
