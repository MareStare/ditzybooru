import type { FieldSpec, Transform } from '../dsl/extract.ts';
import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';
import { communicationFields } from './communication.ts';
import { mediaFields, representationFields, urlAt } from './media.ts';

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
            representations: { ...data('uris'), json: true, map: representationFields() },
            mimeType: { sel: '.image-target', attr: 'data-mime-type' },
            sizeBytes: { sel: '.image-target', attr: 'data-image-size', as: 'int' },
            uploader: { sel: '.image_uploader strong', text: true, optional: true },
            uploaderSlug: { sel: '.image_uploader strong a', attr: 'href', as: 'lastSegment', optional: true },
            descriptionHtml: {
              sel: '.image-description .block__content',
              html: true,
              as: 'sanitizedHtml',
              optional: true,
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
          representations: { from: '/image/representations', map: representationFields() },
          tags: { from: '/image/tags', map: { name: '' } },
          mimeType: '/image/mime_type',
          sizeBytes: '/image/size',
          uploader: '/image/uploader',
          description: '/image/description',
        },
      },
    ],
  },
});

/** The image Philomena features today, for the home page. */
export const getFeatured = defineOperation({
  operationId: 'getFeatured',
  path: '/images/featured',
  method: 'get',
  summary: 'The featured image of the day.',
  tags: ['images'],
  response: s.ref('Media'),
  philomena: {
    routes: ['GET /api/v1/json/images/featured'],
    auth: 'none',
    // It changes once a day.
    cacheSeconds: 600,
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/images/featured' },
        map: mediaFields('/image'),
      },
    ],
  },
});

/** An image's comments, as the image page lists them. */
export const listImageComments = defineOperation({
  operationId: 'listImageComments',
  path: '/images/{id}/comments',
  method: 'get',
  summary: 'The comments of an image, 25 to a page, as the image page lists them.',
  tags: ['images'],
  params: [
    { name: 'id', in: 'path', schema: s.int(), required: true },
    { name: 'page', in: 'query', schema: s.int() },
  ],
  response: s.ref('ImageComments'),
  examples: { id: 1 },
  philomena: {
    routes: ['GET /images/:image_id/comments'],
    auth: 'none',
    strategies: [
      {
        // The site's own fragment: rendered text, in the page's order.
        kind: 'html',
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/images/{id}/comments', query: { page: '{page|1}' } },
        template: 'lib/philomena_web/templates/image/comment/index.html.slime',
        select: {
          fields: {
            total: { sel: '.page__info .block__header__title', text: true, as: 'lastInt' },
            items: { sel: 'article.communication', many: true, fields: communicationFields() },
          },
        },
      },
      {
        // Derpibooru's pages sit behind a bot challenge: the JSON search has
        // the comments, as the markup their authors wrote.
        kind: 'json',
        flavors: ['derpibooru'],
        request: {
          method: 'GET',
          path: '/api/v1/json/search/comments',
          query: { q: 'image_id:{id}', sf: 'created_at', sd: 'asc', page: '{page|1}', per_page: '25' },
        },
        map: {
          total: '/total',
          items: {
            from: '/comments',
            map: {
              id: '/id',
              author: '/author',
              createdAt: '/created_at',
              body: '/body',
              avatarUrl: urlAt('/avatar'),
            },
          },
        },
      },
    ],
  },
});

/** What the visitor did to an image: faved, voted, hidden. Needs their session cookie. */
export const getImageInteractions = defineOperation({
  operationId: 'getImageInteractions',
  path: '/images/{id}/interactions',
  method: 'get',
  summary: 'What the signed-in visitor has done to an image (fave, vote, hide), read from its page.',
  tags: ['images'],
  params: [{ name: 'id', in: 'path', schema: s.int(), required: true }],
  response: s.ref('ImageInteractions'),
  examples: { id: 1 },
  philomena: {
    routes: ['GET /images/:id'],
    auth: 'session',
    strategies: [
      {
        kind: 'html',
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/images/{id}' },
        template: 'lib/philomena_web/templates/layout/app.html.slime',
        select: {
          fields: {
            // The page lists the visitor's interactions with the images on it.
            interactions: { sel: '.js-datastore', attr: 'data-interactions', json: true },
          },
        },
      },
    ],
  },
});
