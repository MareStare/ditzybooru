import type { JsonMap } from '../dsl/extract.ts';

/**
 * How one upstream image maps to the `Media` schema. `prefix` is the pointer to
 * the image inside the response: empty for an item of a list, `/image` for a
 * single-image response.
 */
export function mediaFields(prefix = ''): JsonMap {
  return {
    id: `${prefix}/id`,
    createdAt: `${prefix}/created_at`,
    width: `${prefix}/width`,
    height: `${prefix}/height`,
    aspectRatio: `${prefix}/aspect_ratio`,
    mimeType: `${prefix}/mime_type`,
    tags: `${prefix}/tags`,
    tagCount: `${prefix}/tag_count`,
    score: `${prefix}/score`,
    upvotes: `${prefix}/upvotes`,
    downvotes: `${prefix}/downvotes`,
    faves: `${prefix}/faves`,
    commentCount: `${prefix}/comment_count`,
    sourceUrls: `${prefix}/source_urls`,
    representations: {
      from: `${prefix}/representations`,
      map: {
        full: '/full',
        tall: '/tall',
        large: '/large',
        medium: '/medium',
        small: '/small',
        thumb: '/thumb',
        thumbSmall: '/thumb_small',
        thumbTiny: '/thumb_tiny',
      },
    },
    spoilered: `${prefix}/spoilered`,
    hiddenFromUsers: `${prefix}/hidden_from_users`,
  };
}
