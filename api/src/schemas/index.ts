import { s } from '../dsl/schema.ts';

const Representations = s.object({
  full: s.uri(),
  tall: s.uri(),
  large: s.uri(),
  medium: s.uri(),
  small: s.uri(),
  thumb: s.uri(),
  thumbSmall: s.uri(),
  thumbTiny: s.uri(),
});

const ErrorBody = s.object({
  error: s.object({ code: s.string(), message: s.string() }),
});

const ImageTag = s.object({
  name: s.string(),
  // Only the HTML page carries these; Derpibooru's JSON API has the names only.
  id: s.optional(s.int()),
  slug: s.optional(s.string()),
  category: s.optional(s.nullable(s.string())),
  imageCount: s.optional(s.int()),
});

const ImagePage = s.object({
  id: s.int(),
  createdAt: s.dateTime(),
  width: s.int(),
  height: s.int(),
  aspectRatio: s.number(),
  tagCount: s.int(),
  score: s.int(),
  upvotes: s.int(),
  downvotes: s.int(),
  faves: s.int(),
  commentCount: s.int(),
  sourceUrls: s.array(s.string()),
  representations: s.ref('Representations'),
  tags: s.array(s.ref('ImageTag'), 1),
});

/** One image in a listing; mirrors the frontend's `Media`. */
const MediaItem = s.object({
  id: s.int(),
  createdAt: s.dateTime(),
  width: s.int(),
  height: s.int(),
  aspectRatio: s.number(),
  mimeType: s.string(),
  tags: s.array(s.string()),
  tagCount: s.int(),
  score: s.int(),
  upvotes: s.int(),
  downvotes: s.int(),
  faves: s.int(),
  commentCount: s.int(),
  sourceUrls: s.array(s.string()),
  representations: s.ref('Representations'),
  spoilered: s.bool(),
  hiddenFromUsers: s.bool(),
});

const SearchPage = s.object({
  items: s.array(s.ref('MediaItem')),
  total: s.int(),
  page: s.int(),
  perPage: s.int(),
});

export const schemas = { Representations, ImageTag, ImagePage, MediaItem, SearchPage, Error: ErrorBody };
