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
  mimeType: s.string(),
  sizeBytes: s.int(),
  /** Who uploaded it; `null` for an anonymous upload. */
  uploader: s.optional(s.nullable(s.string())),
  /** The path segment of the uploader's profile. */
  uploaderSlug: s.optional(s.nullable(s.string())),
  /** The description as HTML cleaned by the backend: safe to render. */
  descriptionHtml: s.optional(s.nullable(s.string())),
  /** The description as the uploader wrote it (markdown), where the site's HTML is not available. */
  description: s.optional(s.string()),
});

const ImageComments = s.object({
  /** Every comment of the image, across pages. */
  total: s.int(),
  items: s.array(s.ref('RenderedPost')),
});

/** What the signed-in visitor did to an image, as the site's page records it. */
const ImageInteractions = s.object({
  interactions: s.array(
    s.object({
      image_id: s.int(),
      interaction_type: s.enum('faved', 'voted', 'hidden'),
      /** `up` or `down` for a vote; empty for a fave or a hide. */
      value: s.nullable(s.string()),
      user_id: s.optional(s.int()),
    }),
  ),
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

/** What the signed-in user did to an image. Only filled when the request carries their API key. */
const Interaction = s.object({
  imageId: s.int(),
  type: s.enum('faved', 'voted', 'hidden'),
  /** `up` or `down` for a vote, `null` otherwise. */
  value: s.nullable(s.enum('up', 'down')),
});

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

const ProfilePage = s.object({
  id: s.int(),
  name: s.string(),
  createdAt: s.dateTime(),
  avatarUrl: s.nullable(s.uri()),
  /** What the user wrote about themselves; cleaned, so safe to render. */
  aboutHtml: s.nullable(s.string()),
  /** The last 90 days, as the site counts them. */
  stats: s.array(s.object({ label: s.string(), value: s.int() })),
});

const commentFields = {
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
};

/** One comment, as the comment page shows it. */
const CommentDetail = s.object(commentFields);

const Comment = s.object({
  ...commentFields,
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

const GalleryPage = s.object({
  id: s.int(),
  title: s.string(),
  description: s.string(),
  spoilerWarning: s.string(),
  thumbnailId: s.int(),
  user: s.string(),
  userId: s.int(),
  page: s.int(),
  perPage: s.int(),
  /** How many images the gallery holds across every page, as the active filter sees them. */
  imageTotal: s.int(),
  /** This page of the gallery's images, in gallery order. */
  images: s.array(s.ref('Media')),
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

const Forum = s.object({
  slug: s.string(),
  name: s.string(),
  description: s.string(),
  postCount: s.int(),
  topicCount: s.int(),
});

const Topic = s.object({
  slug: s.string(),
  title: s.string(),
  sticky: s.bool(),
  locked: s.bool(),
  postCount: s.int(),
  viewCount: s.int(),
  lastRepliedAt: s.dateTime(),
  /** Who started the topic. */
  author: s.string(),
  authorId: s.nullable(s.int()),
});

const Profile = s.object({
  id: s.int(),
  name: s.string(),
  slug: s.string(),
  role: s.string(),
  description: s.nullable(s.string()),
  createdAt: s.dateTime(),
  avatarUrl: s.nullable(s.uri()),
  commentsCount: s.int(),
  postsCount: s.int(),
  topicsCount: s.int(),
  uploadsCount: s.int(),
  /** Tags the user has linked to their account. */
  links: s.array(
    s.object({
      state: s.string(),
      tagId: s.nullable(s.int()),
      createdAt: s.dateTime(),
    }),
  ),
  awards: s.array(
    s.object({
      id: s.int(),
      title: s.string(),
      label: s.nullable(s.string()),
      awardedOn: s.dateTime(),
      imageUrl: s.uri(),
    }),
  ),
});

/** The embed card of an image page, as oEmbed describes it. */
const Embed = s.object({
  title: s.string(),
  imageId: s.int(),
  imageUrl: s.uri(),
  width: s.int(),
  height: s.int(),
  thumbnailUrl: s.uri(),
  thumbnailWidth: s.int(),
  thumbnailHeight: s.int(),
  authorName: s.string(),
  authorUrl: s.uri(),
  providerName: s.string(),
  providerUrl: s.uri(),
  score: s.int(),
  commentCount: s.int(),
  tags: s.array(s.string()),
});

const Rule = s.object({
  id: s.int(),
  title: s.string(),
  important: s.bool(),
  /** The rule's text, as HTML cleaned by the backend: safe to render. */
  bodyHtml: s.string(),
  /** Worked examples, as HTML cleaned by the backend: safe to render. */
  examplesHtml: s.nullable(s.string()),
});

const StaffMember = s.object({
  name: s.string(),
  profileUrl: s.uri(),
  avatarUrl: s.nullable(s.uri()),
  description: s.string(),
});

const StaffGroup = s.object({
  name: s.string(),
  description: s.string(),
  members: s.array(s.ref('StaffMember')),
});

const StaticPage = s.object({
  title: s.string(),
  updatedAt: s.dateTime(),
  /** The page's text, as HTML cleaned by the backend: safe to render. */
  bodyHtml: s.string(),
});

const TagSuggestion = s.object({
  /** What the suggestion list shows, with the image count: `safe (6)`. */
  label: s.string(),
  /** The tag name to put in the query. */
  tag: s.string(),
});

/** Who the visitor is on the site. Everything after `signedIn` is `null` when signed out. */
const Session = s.object({
  signedIn: s.bool(),
  id: s.nullable(s.int()),
  name: s.nullable(s.string()),
  slug: s.nullable(s.string()),
  role: s.nullable(s.string()),
  /** The avatar the site shows for them, or `null` when they have none. */
  avatarUrl: s.nullable(s.uri()),
  /** Signed in with the password, but the site still wants the 2FA code (`createSessionTotp`). */
  secondFactorRequired: s.bool(),
});

/** The visitor's own key. Sent only to them, never kept or logged by us. */
const ApiKey = s.object({ apiKey: s.string() });

const LoginCaptcha = s.object({
  /** The hCaptcha site key to show a widget for, or `null` when the site asks for none. */
  siteKey: s.nullable(s.string()),
});

/** An image's counters after something a visitor did to it. */
const ImageCounters = s.object({
  score: s.int(),
  upvotes: s.int(),
  downvotes: s.int(),
  faves: s.int(),
});

/** One forum post or image comment. Philomena sites give rendered text, Derpibooru only the markup the author wrote. */
const RenderedPost = s.object({
  id: s.int(),
  author: s.string(),
  /** The path segment of the author's profile, or `null` for an anonymous post. */
  authorSlug: s.optional(s.nullable(s.string())),
  avatarUrl: s.optional(s.nullable(s.uri())),
  createdAt: s.dateTime(),
  /** The post as HTML cleaned by the backend: safe to render. */
  bodyHtml: s.optional(s.string()),
  /** The post as the author wrote it (markdown), where the site's HTML is not available. */
  body: s.optional(s.string()),
});

const TopicPage = s.object({
  slug: s.string(),
  title: s.string(),
  forumSlug: s.string(),
  forumName: s.string(),
  /** Who started the topic. */
  author: s.string(),
  startedAt: s.optional(s.dateTime()),
  /** Every post of the topic, across pages. */
  postCount: s.int(),
  posts: s.array(s.ref('RenderedPost')),
});

const Channel = s.object({
  id: s.int(),
  title: s.string(),
  live: s.bool(),
  /** Only known while the stream is live. */
  viewers: s.nullable(s.int()),
  nsfw: s.bool(),
  thumbnailUrl: s.uri(),
  /** The artist's tag name, if the channel has one. */
  artistTag: s.nullable(s.string()),
});

const ForumTopic = s.object({
  slug: s.string(),
  title: s.string(),
  sticky: s.bool(),
  locked: s.bool(),
  postCount: s.int(),
  lastRepliedAt: s.dateTime(),
  /** Who started the topic. The API does not name the last poster. */
  author: s.string(),
  authorId: s.nullable(s.int()),
  forum: s.object({ slug: s.string(), name: s.string() }),
});

export const schemas = {
  Representations,
  ImageTag,
  ImagePage,
  ImageComments,
  ImageInteractions,
  ApiKey,
  Media,
  Tag,
  Comment,
  CommentDetail,
  Post,
  Gallery,
  GalleryPage,
  Filter,
  Forum,
  Topic,
  Profile,
  Embed,
  Rule,
  ProfilePage,
  StaffMember,
  StaffGroup,
  StaticPage,
  TagSuggestion,
  Session,
  LoginCaptcha,
  ImageCounters,
  RenderedPost,
  TopicPage,
  Channel,
  ForumTopic,
  ForumActivity: s.object({ items: s.array(s.ref('ForumTopic')) }),
  Interaction,
  MediaSearchResults: s.object({
    items: s.array(s.ref('Media')),
    total: s.int(),
    page: s.int(),
    perPage: s.int(),
    interactions: s.array(s.ref('Interaction')),
  }),
  TagResults: results('Tag'),
  CommentResults: results('Comment'),
  PostResults: results('Post'),
  GalleryResults: results('Gallery'),
  FilterResults: results('Filter'),
  RuleList: s.object({ updatedAt: s.dateTime(), items: s.array(s.ref('Rule')) }),
  StaffPage: s.object({ groups: s.array(s.ref('StaffGroup')) }),
  ForumList: s.object({ items: s.array(s.ref('Forum')) }),
  TagSuggestionList: s.object({ items: s.array(s.ref('TagSuggestion')) }),
  TopicResults: results('Topic'),
  ChannelList: s.object({ items: s.array(s.ref('Channel')) }),
  FilterList: s.object({ items: s.array(s.ref('Filter')) }),
  Error: ErrorBody,
};
