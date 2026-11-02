import type { JsonMap } from '../dsl/extract.ts';

/** A pointer whose value is a URL that may be relative to the upstream's origin. */
export function urlAt(pointer: string): JsonMap[string] {
  return { from: pointer, as: 'url' };
}

/** The `Representations` fields, pointers relative to the representations object. */
export function representationFields(): JsonMap {
  return {
    full: urlAt('/full'),
    tall: urlAt('/tall'),
    large: urlAt('/large'),
    medium: urlAt('/medium'),
    small: urlAt('/small'),
    thumb: urlAt('/thumb'),
    thumbSmall: urlAt('/thumb_small'),
    thumbTiny: urlAt('/thumb_tiny'),
  };
}

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
    representations: { from: `${prefix}/representations`, map: representationFields() },
    spoilered: `${prefix}/spoilered`,
    hiddenFromUsers: `${prefix}/hidden_from_users`,
  };
}
