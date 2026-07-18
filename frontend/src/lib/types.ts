/**
 * Domain types for the Ditzybooru frontend.
 *
 * These mirror the shapes exposed by the Philomena REST API (see
 * `openapi.yaml` in the philomena repo) so that the mock data used during this
 * migration can be swapped for real API responses with minimal churn. Only the
 * fields the home page actually needs are modelled here.
 */

/** The MIME types Philomena serves for image records. */
export type ImageMimeType = 'image/gif' | 'image/jpeg' | 'image/png' | 'image/svg+xml' | 'video/webm';

/**
 * Pre-rendered thumbnail URLs for a single image. A size only points at a
 * downscaled file when the original is larger than that size; otherwise it
 * points at the full image.
 */
export interface Representations {
  full: string;
  tall: string;
  large: string;
  medium: string;
  small: string;
  thumb: string;
  thumbSmall: string;
  thumbTiny: string;
}

/** A single image/media record. */
export interface Image {
  id: number;
  createdAt: string;
  width: number;
  height: number;
  aspectRatio: number;
  mimeType: ImageMimeType;
  /** Tag names, ordered as Philomena orders them for display. */
  tags: Array<string>;
  tagCount: number;
  score: number;
  upvotes: number;
  downvotes: number;
  faves: number;
  commentCount: number;
  sourceUrls: Array<string>;
  representations: Representations;
  /** Whether the image is hit by the current filter and should be spoilered. */
  spoilered: boolean;
  /** Whether the image was deleted/merged and hidden from users. */
  hiddenFromUsers: boolean;
}

/** A registered user, as far as the home page cares about it. */
export interface User {
  id: number;
  name: string;
  slug: string;
  avatarUrl: string | null;
}

/** An anonymous-or-named attribution attached to comments/posts. */
export interface Attribution {
  user: User | null;
  /** Displayed when the author posted anonymously. */
  anonymousName: string | null;
}

/** A recent comment, as shown in the activity sidebar. */
export interface Comment {
  id: number;
  imageId: number;
  createdAt: string;
  author: Attribution;
  /** The tiny thumbnail of the image the comment was made on. */
  imageThumbTiny: string;
}

/** A live-stream channel. */
export interface Channel {
  id: number;
  title: string;
  shortName: string;
  isLive: boolean;
  nsfw: boolean;
  viewers: number;
  avatarUrl: string | null;
}

/** A discussion forum. */
export interface Forum {
  id: string;
  name: string;
  slug: string;
}

/** A forum topic, as shown in the activity sidebar. */
export interface Topic {
  id: number;
  title: string;
  slug: string;
  sticky: boolean;
  forum: Forum;
  lastPost: {
    id: number;
    author: Attribution;
  } | null;
}
