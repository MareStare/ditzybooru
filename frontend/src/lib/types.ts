export type MimeType = 'image/gif' | 'image/jpeg' | 'image/png' | 'image/svg+xml' | 'video/webm';

export interface MediaReprs {
  full: string;
  tall: string;
  large: string;
  medium: string;
  small: string;
  thumb: string;
  thumbSmall: string;
  thumbTiny: string;
}

export interface Media {
  id: number;
  createdAt: string;
  width: number;
  height: number;
  aspectRatio: number;
  mimeType: MimeType;
  /** Tag names, ordered as Philomena orders them for display. */
  tags: Array<string>;
  tagCount: number;
  score: number;
  upvotes: number;
  downvotes: number;
  faves: number;
  commentCount: number;
  sourceUrls: Array<string>;
  representations: MediaReprs;
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
  avatarUrl: null | string;
}

/** An anonymous-or-named attribution attached to comments/posts. */
export interface Attribution {
  user: null | User;
  /** Displayed when the author posted anonymously. */
  anonymousName: null | string;
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

export interface LiveStreamChannel {
  id: number;
  title: string;
  isLive: boolean;
  nsfw: boolean;
  /** Zero while off air. */
  viewers: number;
}

/** A gallery and one page of its images. */
export interface Gallery {
  id: number;
  title: string;
  description: string;
  /** Who made the gallery. */
  creator: string;
  /** How many images the gallery holds across every page. */
  imageTotal: number;
  images: Array<Media>;
}

export interface Forum {
  id: string;
  name: string;
  slug: string;
}

export interface ForumTopic {
  slug: string;
  title: string;
  sticky: boolean;
  locked: boolean;
  postCount: number;
  /** When the latest reply was posted. */
  lastRepliedAt: string;
  /** Who started the topic. The API does not say who replied last. */
  author: string;
  forum: Pick<Forum, 'name' | 'slug'>;
}
