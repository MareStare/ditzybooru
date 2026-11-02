import type { FieldSpec, Transform } from '../dsl/extract.ts';
import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';

const container = '.image-show-container';

/** A `data-*` attribute of the image page's main container. */
function data(attr: string, as?: Transform): FieldSpec {
  return { sel: container, attr: `data-${attr}`, ...(as ? { as } : {}) };
}

/** The image page: everything the page shows, in one response. */
export const getImage = defineOperation({
  operationId: 'getImage',
  path: '/images/{id}',
  method: 'get',
  summary: 'Fetch the image page: metadata, counters, media URLs and tags.',
  tags: ['images'],
  params: [{ name: 'id', in: 'path', schema: s.int(), required: true }],
  response: s.ref('ImagePage'),
  examples: { id: 1 },
  philomena: {
    routes: ['GET /images/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'html',
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/images/{id}' },
        template: 'lib/philomena_web/templates/image/show.html.slime',
        select: {
          fields: {
            id: data('image-id', 'int'),
            createdAt: data('created-at'),
            width: data('width', 'int'),
            height: data('height', 'int'),
            aspectRatio: data('aspect-ratio', 'float'),
            tagCount: data('tag-count', 'int'),
            score: data('score', 'int'),
            upvotes: data('upvotes', 'int'),
            downvotes: data('downvotes', 'int'),
            faves: data('faves', 'int'),
            commentCount: data('comment-count', 'int'),
            sourceUrls: { ...data('source-urls'), json: true },
            representations: {
              ...data('uris'),
              json: true,
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
            tags: {
              sel: '.tag-list .tag[data-tag-id]',
              many: true,
              fields: {
                id: { attr: 'data-tag-id', as: 'int' },
                name: { attr: 'data-tag-name' },
                slug: { attr: 'data-tag-slug' },
                category: { attr: 'data-tag-category', optional: true },
                imageCount: { sel: '.tag__count', text: true, as: 'int' },
              },
            },
          },
        },
      },
      {
        // Derpibooru serves its HTML pages behind a bot challenge.
        kind: 'json',
        flavors: ['derpibooru'],
        request: { method: 'GET', path: '/api/v1/json/images/{id}' },
        map: {
          id: '/image/id',
          createdAt: '/image/first_seen_at',
          width: '/image/width',
          height: '/image/height',
          aspectRatio: '/image/aspect_ratio',
          tagCount: '/image/tag_count',
          score: '/image/score',
          upvotes: '/image/upvotes',
          downvotes: '/image/downvotes',
          faves: '/image/faves',
          commentCount: '/image/comment_count',
          sourceUrls: '/image/source_urls',
          representations: {
            from: '/image/representations',
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
          tags: { from: '/image/tags', map: { name: '' } },
        },
      },
    ],
  },
});
