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
const Media = s.object({
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

/** One page of a listing: the items, the total match count and the paging used. */
function results(item: string) {
  return s.object({
    items: s.array(s.ref(item)),
    total: s.int(),
    page: s.int(),
    perPage: s.int(),
  });
}

const Tag = s.object({
  id: s.int(),
  name: s.string(),
  slug: s.string(),
  namespace: s.nullable(s.string()),
  nameInNamespace: s.string(),
  category: s.nullable(s.string()),
  shortDescription: s.nullable(s.string()),
  description: s.string(),
  imageCount: s.int(),
  aliases: s.array(s.string()),
  aliasedTag: s.nullable(s.string()),
  impliedTags: s.array(s.string()),
  impliedByTags: s.array(s.string()),
  spoilerImageUrl: s.nullable(s.string()),
});

const Comment = s.object({
  id: s.int(),
  imageId: s.int(),
  createdAt: s.dateTime(),
  updatedAt: s.dateTime(),
  editedAt: s.nullable(s.dateTime()),
  editReason: s.nullable(s.string()),
  body: s.string(),
  author: s.string(),
  avatarUrl: s.string(),
  /** `null` for anonymous comments. */
  userId: s.nullable(s.int()),
  /** The tiny thumbnail of the image; `null` when the active filter hides it. */
  imageThumbTiny: s.nullable(s.uri()),
});

const Post = s.object({
  id: s.int(),
  createdAt: s.dateTime(),
  updatedAt: s.dateTime(),
  editedAt: s.nullable(s.dateTime()),
  editReason: s.nullable(s.string()),
  body: s.string(),
  author: s.string(),
  avatarUrl: s.string(),
  userId: s.nullable(s.int()),
});

const Gallery = s.object({
  id: s.int(),
  title: s.string(),
  description: s.string(),
  spoilerWarning: s.string(),
  thumbnailId: s.int(),
  user: s.string(),
  userId: s.int(),
});

const Filter = s.object({
  id: s.int(),
  name: s.string(),
  description: s.string(),
  public: s.bool(),
  system: s.bool(),
  userCount: s.int(),
  userId: s.nullable(s.int()),
  hiddenTagIds: s.array(s.int()),
  spoileredTagIds: s.array(s.int()),
  hiddenComplex: s.nullable(s.string()),
  spoileredComplex: s.nullable(s.string()),
});

export const schemas = {
  Representations,
  ImageTag,
  ImagePage,
  Media,
  Tag,
  Comment,
  Post,
  Gallery,
  Filter,
  MediaResults: results('Media'),
  TagResults: results('Tag'),
  CommentResults: results('Comment'),
  PostResults: results('Post'),
  GalleryResults: results('Gallery'),
  FilterResults: results('Filter'),
  Error: ErrorBody,
};
