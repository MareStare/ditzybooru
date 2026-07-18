/**
 * Mock data for the home (activity) page.
 *
 * During the migration the frontend has no real backend wired up yet, so this
 * module fabricates data shaped like the Philomena API responses. Thumbnail
 * URLs point at the public Derpibooru CDN (see {@link MEDIA_ORIGIN}); the six
 * source images are the ones seeded in Philomena's
 * `priv/repo/seeds_development.json`, so the mockup renders with real imagery.
 */
import type { Channel, Comment, Forum, Image, ImageMimeType, Representations, Topic, User } from '#/lib/types';

/**
 * Origin that serves the mock media files — the Derpibooru CDN, as referenced
 * by Philomena's development seeds. Swap for the real Ditzybooru media proxy
 * once the backend exists.
 */
const MEDIA_ORIGIN = 'https://derpicdn.net';

interface ImageSeed {
  id: number;
  /** CDN path of the image, `/img/<YYYY>/<M>/<D>/<id>` (no trailing size). */
  base: string;
  /** Extension of the raster thumbnail representations (png/jpg/gif). */
  ext: string;
  width: number;
  height: number;
  mimeType: ImageMimeType;
  tags: Array<string>;
}

function representations(seed: ImageSeed): Representations {
  // Derpibooru serves each size at `/img/<date>/<id>/<size>.<ext>`.
  const url = (name: string) => `${MEDIA_ORIGIN}${seed.base}/${name}`;
  return {
    full: url(`full.${seed.ext}`),
    tall: url(`tall.${seed.ext}`),
    large: url(`large.${seed.ext}`),
    medium: url(`medium.${seed.ext}`),
    small: url(`small.${seed.ext}`),
    thumb: url(`thumb.${seed.ext}`),
    thumbSmall: url(`thumb_small.${seed.ext}`),
    thumbTiny: url(`thumb_tiny.${seed.ext}`),
  };
}

/**
 * The six images seeded by Philomena's `priv/repo/seeds_development.json`,
 * identified by their Derpibooru CDN paths. The gallery below is built by
 * cycling through these with fabricated stats.
 */
const seeds: Array<ImageSeed> = [
  {
    // https://derpicdn.net/img/view/2019/6/16/2067468.svg (raster thumbs are png)
    id: 6,
    base: '/img/2019/6/16/2067468',
    ext: 'png',
    width: 711,
    height: 963,
    mimeType: 'image/svg+xml',
    tags: [
      'safe',
      'artist:cheezedoodle96',
      '.svg available',
      'babs seed',
      'bloom and gloom',
      'cutie mark',
      'no pony',
      'scissors',
      'simple background',
      'svg',
      'transparent background',
      'vector',
    ],
  },
  {
    // https://derpicdn.net/img/view/2016/3/17/1110529.jpg
    id: 5,
    base: '/img/2016/3/17/1110529',
    ext: 'jpg',
    width: 5300,
    height: 2656,
    mimeType: 'image/jpeg',
    tags: [
      'safe',
      'artist:devinian',
      'aurora crystialis',
      'bridge',
      'cloud',
      'crepuscular rays',
      'crystal empire',
      'forest',
      'mountain',
      'scenery',
      'sunset',
      'wallpaper',
    ],
  },
  {
    // https://derpicdn.net/img/view/2015/2/19/832750.jpg
    id: 4,
    base: '/img/2015/2/19/832750',
    ext: 'jpg',
    width: 900,
    height: 636,
    mimeType: 'image/jpeg',
    tags: [
      'safe',
      'artist:rhads',
      'canterlot',
      'cloud',
      'cloudsdale',
      'lens flare',
      'ponyville',
      'rainbow',
      'scenery',
      'sweet apple acres',
    ],
  },
  {
    // https://derpicdn.net/img/2018/6/28/1767886/full.webm (raster thumbs are gif)
    id: 3,
    base: '/img/2018/6/28/1767886',
    ext: 'gif',
    width: 960,
    height: 640,
    mimeType: 'video/webm',
    tags: [
      'safe',
      'artist:hydrusbeta',
      '3d',
      'animated',
      'architecture',
      'castle',
      'crystal empire',
      'crystal palace',
      'scenery',
      'webm',
    ],
  },
  {
    // https://derpicdn.net/img/2012/1/2/25/large.png
    id: 2,
    base: '/img/2012/1/2/25',
    ext: 'png',
    width: 1280,
    height: 800,
    mimeType: 'image/png',
    tags: [
      'safe',
      'artist:moe',
      'canterlot',
      'castle',
      'cliff',
      'detailed background',
      'forest',
      'mountain range',
      'scenery',
      'sunset',
      'waterfall',
      'widescreen',
    ],
  },
  {
    // https://derpicdn.net/img/2015/9/26/988000/thumb.gif
    id: 1,
    base: '/img/2015/9/26/988000',
    ext: 'gif',
    width: 250,
    height: 141,
    mimeType: 'image/gif',
    tags: [
      'safe',
      'artist:assasinmonkey',
      'alicorn',
      'animated',
      'epic',
      'fight',
      'good vs evil',
      'lord tirek',
      'magic',
      'twilight sparkle',
      "twilight's kingdom",
    ],
  },
];

function seedById(id: number): ImageSeed {
  const seed = seeds.find(s => s.id === id);
  if (!seed) {
    throw new Error(`BUG: no image seed with id ${String(id)}`);
  }
  return seed;
}

interface ImageStats {
  score: number;
  upvotes: number;
  downvotes: number;
  faves: number;
  commentCount: number;
  spoilered?: boolean;
}

function makeImage(id: number, seedId: number, stats: ImageStats): Image {
  const seed = seedById(seedId);
  return {
    id,
    createdAt: '2026-05-02T14:14:46Z',
    width: seed.width,
    height: seed.height,
    aspectRatio: seed.width / seed.height,
    mimeType: seed.mimeType,
    tags: seed.tags,
    tagCount: seed.tags.length,
    score: stats.score,
    upvotes: stats.upvotes,
    downvotes: stats.downvotes,
    faves: stats.faves,
    commentCount: stats.commentCount,
    sourceUrls: [],
    representations: representations(seed),
    spoilered: stats.spoilered ?? false,
    hiddenFromUsers: false,
  };
}

// The main image list. Real thumbnails, fabricated stats — cycles through the
// available seeds so the grid looks full.
export const images: Array<Image> = [
  makeImage(1024, 2, { score: 412, upvotes: 430, downvotes: 18, faves: 268, commentCount: 24 }),
  makeImage(1023, 5, { score: 389, upvotes: 401, downvotes: 12, faves: 251, commentCount: 9 }),
  makeImage(1022, 6, { score: 305, upvotes: 320, downvotes: 15, faves: 198, commentCount: 41 }),
  makeImage(1021, 4, { score: 274, upvotes: 288, downvotes: 14, faves: 176, commentCount: 6 }),
  makeImage(1020, 1, { score: 913, upvotes: 940, downvotes: 27, faves: 604, commentCount: 132 }),
  makeImage(1019, 3, { score: 187, upvotes: 201, downvotes: 14, faves: 88, commentCount: 3 }),
  makeImage(1018, 5, { score: 156, upvotes: 168, downvotes: 12, faves: 97, commentCount: 5 }),
  makeImage(1017, 2, { score: 142, upvotes: 150, downvotes: 8, faves: 79, commentCount: 2 }),
  makeImage(1016, 6, { score: 98, upvotes: 110, downvotes: 12, faves: 54, commentCount: 18 }),
  makeImage(1015, 4, { score: 76, upvotes: 82, downvotes: 6, faves: 41, commentCount: 1 }),
  makeImage(1014, 1, { score: 64, upvotes: 70, downvotes: 6, faves: 33, commentCount: 7 }),
  makeImage(1013, 3, { score: 51, upvotes: 58, downvotes: 7, faves: 22, commentCount: 0 }),
  makeImage(1012, 2, { score: 43, upvotes: 47, downvotes: 4, faves: 19, commentCount: 4 }),
  makeImage(1011, 5, { score: 38, upvotes: 40, downvotes: 2, faves: 25, commentCount: 2 }),
  makeImage(1010, 6, { score: 12, upvotes: 20, downvotes: 8, faves: 6, commentCount: 0, spoilered: true }),
];

/** The featured image shown at the top of the sidebar. */
export const featuredImage: Image = makeImage(1020, 1, {
  score: 913,
  upvotes: 940,
  downvotes: 27,
  faves: 604,
  commentCount: 132,
});

/** "Trending Images" — top scoring images from the last 3 days. */
export const topScoring: Array<Image> = [
  makeImage(2004, 2, { score: 1204, upvotes: 1230, downvotes: 26, faves: 812, commentCount: 44 }),
  makeImage(2003, 5, { score: 1096, upvotes: 1120, downvotes: 24, faves: 733, commentCount: 31 }),
  makeImage(2002, 4, { score: 987, upvotes: 1005, downvotes: 18, faves: 690, commentCount: 12 }),
  makeImage(2001, 6, { score: 842, upvotes: 870, downvotes: 28, faves: 588, commentCount: 63 }),
];

/** Watched images (only shown when the user is signed in). */
export const watchedImages: Array<Image> = [
  makeImage(3006, 4, { score: 88, upvotes: 92, downvotes: 4, faves: 51, commentCount: 3 }),
  makeImage(3005, 3, { score: 61, upvotes: 66, downvotes: 5, faves: 30, commentCount: 1 }),
  makeImage(3004, 6, { score: 45, upvotes: 49, downvotes: 4, faves: 27, commentCount: 8 }),
  makeImage(3003, 2, { score: 33, upvotes: 35, downvotes: 2, faves: 18, commentCount: 0 }),
];

const users = {
  pleb: { id: 1, name: 'Pleb', slug: 'Pleb', avatarUrl: null },
  moonlight: { id: 2, name: 'Moonlight', slug: 'Moonlight', avatarUrl: null },
  scootaloo: { id: 3, name: 'Scootaloo', slug: 'Scootaloo', avatarUrl: null },
} satisfies Record<string, User>;

const forums = {
  dis: { id: 'dis', name: 'General Discussion', slug: 'dis' },
  art: { id: 'art', name: 'Art Chat', slug: 'art' },
  pony: { id: 'pony', name: 'Shows and Movies', slug: 'pony' },
  meta: { id: 'meta', name: 'Site and Policy', slug: 'meta' },
} satisfies Record<string, Forum>;

/** Live-stream channels shown in the "Streams" block. */
export const channels: Array<Channel> = [
  {
    id: 1,
    title: 'Ponyville Live',
    shortName: 'ponyville-live',
    isLive: true,
    nsfw: false,
    viewers: 342,
    avatarUrl: null,
  },
  {
    id: 2,
    title: 'Sketchy Sundays',
    shortName: 'sketchy-sundays',
    isLive: true,
    nsfw: false,
    viewers: 1,
    avatarUrl: null,
  },
  {
    id: 3,
    title: 'Canterlot Radio',
    shortName: 'canterlot-radio',
    isLive: true,
    nsfw: false,
    viewers: 87,
    avatarUrl: null,
  },
  {
    id: 4,
    title: 'After Dark Doodles',
    shortName: 'after-dark',
    isLive: false,
    nsfw: true,
    viewers: 0,
    avatarUrl: null,
  },
  { id: 5, title: 'Everfree Network', shortName: 'everfree', isLive: false, nsfw: false, viewers: 0, avatarUrl: null },
  {
    id: 6,
    title: 'Crystal Empire FM',
    shortName: 'crystal-fm',
    isLive: false,
    nsfw: false,
    viewers: 0,
    avatarUrl: null,
  },
];

/** Recent forum topics shown in the "Forum Activity" block. */
export const topics: Array<Topic> = [
  {
    id: 1,
    title: 'What are you listening to right now?',
    slug: 'what-are-you-listening-to',
    sticky: true,
    forum: forums.dis,
    lastPost: { id: 981, author: { user: users.pleb, anonymousName: null } },
  },
  {
    id: 2,
    title: 'Embedded Images',
    slug: 'embedded-images',
    sticky: false,
    forum: forums.art,
    lastPost: { id: 977, author: { user: users.moonlight, anonymousName: null } },
  },
  {
    id: 3,
    title: 'Season 10 comic discussion',
    slug: 'season-10-comic-discussion',
    sticky: false,
    forum: forums.pony,
    lastPost: { id: 970, author: { user: users.scootaloo, anonymousName: null } },
  },
  {
    id: 4,
    title: 'Site feedback and suggestions',
    slug: 'site-feedback-and-suggestions',
    sticky: false,
    forum: forums.meta,
    lastPost: { id: 965, author: { user: null, anonymousName: 'Background Pony #A4F2' } },
  },
  {
    id: 5,
    title: 'Second Example Topic',
    slug: 'second-example-topic',
    sticky: false,
    forum: forums.dis,
    lastPost: { id: 959, author: { user: users.pleb, anonymousName: null } },
  },
];

function commentThumbTiny(seedId: number): string {
  return representations(seedById(seedId)).thumbTiny;
}

/** Recent comments shown in the "Recent Comments" block. */
export const comments: Array<Comment> = [
  {
    id: 5012,
    imageId: 1020,
    createdAt: '2026-07-18T09:41:00Z',
    author: { user: users.moonlight, anonymousName: null },
    imageThumbTiny: commentThumbTiny(1),
  },
  {
    id: 5011,
    imageId: 1024,
    createdAt: '2026-07-18T09:12:00Z',
    author: { user: null, anonymousName: 'Background Pony #12C9' },
    imageThumbTiny: commentThumbTiny(2),
  },
  {
    id: 5010,
    imageId: 1022,
    createdAt: '2026-07-18T08:55:00Z',
    author: { user: users.scootaloo, anonymousName: null },
    imageThumbTiny: commentThumbTiny(6),
  },
  {
    id: 5009,
    imageId: 1021,
    createdAt: '2026-07-18T08:30:00Z',
    author: { user: users.pleb, anonymousName: null },
    imageThumbTiny: commentThumbTiny(4),
  },
  {
    id: 5008,
    imageId: 1023,
    createdAt: '2026-07-18T07:58:00Z',
    author: { user: users.moonlight, anonymousName: null },
    imageThumbTiny: commentThumbTiny(5),
  },
  {
    id: 5007,
    imageId: 1019,
    createdAt: '2026-07-18T07:20:00Z',
    author: { user: null, anonymousName: 'Background Pony #77A1' },
    imageThumbTiny: commentThumbTiny(3),
  },
];

/** The currently signed-in user, or `null` when browsing anonymously. */
export const currentUser: User | null = {
  id: 42,
  name: 'Nightwatch',
  slug: 'Nightwatch',
  avatarUrl: null,
};

/** Count of currently live channels, shown in the nav bar. */
export const liveChannelCount = channels.filter(c => c.isLive).length;

/** Total number of results, shown in the image list footer. */
export const totalImages = 2_147_483;
