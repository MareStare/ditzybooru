import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';
import { mediaFields, urlAt } from './media.ts';
import { commentMap, filterMap, postMap, tagMap, under } from './maps.ts';

export const getComment = defineOperation({
  operationId: 'getComment',
  path: '/comments/{id}',
  method: 'get',
  summary: 'One image comment.',
  tags: ['comments'],
  params: [{ name: 'id', in: 'path', schema: s.int(), required: true }],
  response: s.ref('CommentDetail'),
  examples: { id: 1 },
  philomena: {
    routes: ['GET /api/v1/json/comments/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/comments/{id}' },
        map: under('/comment', commentMap),
      },
    ],
  },
});

export const getFilter = defineOperation({
  operationId: 'getFilter',
  path: '/filters/{id}',
  method: 'get',
  summary: 'One filter, with the tags it hides and spoilers.',
  tags: ['filters'],
  params: [{ name: 'id', in: 'path', schema: s.int(), required: true }],
  response: s.ref('Filter'),
  examples: { id: 1 },
  philomena: {
    routes: ['GET /api/v1/json/filters/:id', 'GET /filters/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/filters/{id}' },
        map: under('/filter', filterMap),
      },
    ],
  },
});

export const listSystemFilters = defineOperation({
  operationId: 'listSystemFilters',
  path: '/filters/system',
  method: 'get',
  summary: 'The filters the site provides to everyone.',
  tags: ['filters'],
  params: [],
  response: s.ref('FilterList'),
  examples: {},
  philomena: {
    routes: ['GET /api/v1/json/filters/system'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/filters/system' },
        map: { items: { from: '/filters', map: filterMap } },
      },
    ],
  },
});

export const getPostById = defineOperation({
  operationId: 'getPostById',
  path: '/posts/{id}',
  method: 'get',
  summary: 'One forum post by its id, wherever it lives.',
  tags: ['posts'],
  params: [{ name: 'id', in: 'path', schema: s.int(), required: true }],
  response: s.ref('Post'),
  examples: { id: 1 },
  philomena: {
    routes: ['GET /api/v1/json/posts/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/posts/{id}' },
        map: under('/post', postMap),
      },
    ],
  },
});

export const getTag = defineOperation({
  operationId: 'getTag',
  path: '/tags/{slug}',
  method: 'get',
  summary: 'The tag page: one tag with its metadata.',
  tags: ['tags'],
  params: [{ name: 'slug', in: 'path', schema: s.string(), required: true }],
  response: s.ref('Tag'),
  examples: { slug: 'safe' },
  philomena: {
    routes: ['GET /api/v1/json/tags/:id', 'GET /tags/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/tags/{slug}' },
        map: under('/tag', tagMap),
      },
    ],
  },
});

export const getProfile = defineOperation({
  operationId: 'getProfile',
  path: '/users/{id}',
  method: 'get',
  summary: 'The profile page: a user with counters, linked tags and awards.',
  tags: ['profiles'],
  params: [{ name: 'id', in: 'path', schema: s.int(), required: true }],
  response: s.ref('Profile'),
  examples: { id: 4 },
  philomena: {
    routes: ['GET /api/v1/json/profiles/:id', 'GET /profiles/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/profiles/{id}' },
        map: {
          id: '/user/id',
          name: '/user/name',
          slug: '/user/slug',
          role: '/user/role',
          description: '/user/description',
          createdAt: '/user/created_at',
          avatarUrl: urlAt('/user/avatar_url'),
          commentsCount: '/user/comments_count',
          postsCount: '/user/posts_count',
          topicsCount: '/user/topics_count',
          uploadsCount: '/user/uploads_count',
          links: {
            from: '/user/links',
            map: { state: '/state', tagId: '/tag_id', createdAt: '/created_at' },
          },
          awards: {
            from: '/user/awards',
            map: {
              id: '/id',
              title: '/title',
              label: '/label',
              awardedOn: '/awarded_on',
              imageUrl: urlAt('/image_url'),
            },
          },
        },
      },
    ],
  },
});

export const getEmbed = defineOperation({
  operationId: 'getEmbed',
  path: '/oembed',
  method: 'get',
  summary: 'The embed card of an image page or image file URL, for link previews.',
  tags: ['images'],
  params: [
    {
      name: 'url',
      in: 'query',
      schema: s.string(),
      required: true,
      description: 'An image page URL such as `https://example.org/images/1`. Only its path matters.',
    },
  ],
  response: s.ref('Embed'),
  examples: { url: 'https://example.org/images/1' },
  philomena: {
    routes: ['GET /api/v1/json/oembed'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/oembed', query: { url: '{url}' } },
        map: {
          title: '/title',
          imageId: '/derpibooru_id',
          imageUrl: urlAt('/url'),
          width: '/width',
          height: '/height',
          thumbnailUrl: urlAt('/thumbnail_url'),
          thumbnailWidth: '/thumbnail_width',
          thumbnailHeight: '/thumbnail_height',
          authorName: '/author_name',
          authorUrl: urlAt('/author_url'),
          providerName: '/provider_name',
          providerUrl: urlAt('/provider_url'),
          score: '/derpibooru_score',
          commentCount: '/derpibooru_comments',
          tags: '/derpibooru_tags',
        },
      },
    ],
  },
});

export const getGallery = defineOperation({
  operationId: 'getGallery',
  path: '/galleries/{id}',
  method: 'get',
  summary: 'The gallery page: the gallery and one page of its images, in gallery order.',
  tags: ['galleries'],
  params: [
    { name: 'id', in: 'path', schema: s.int(), required: true },
    { name: 'page', in: 'query', schema: s.int() },
    { name: 'perPage', in: 'query', schema: s.int(), description: 'At most 50.' },
  ],
  response: s.ref('GalleryPage'),
  examples: { id: 1, perPage: 2 },
  philomena: {
    routes: ['GET /galleries/:id', 'GET /api/v1/json/search/galleries', 'GET /api/v1/json/search/images'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        // There is no JSON route for one gallery, so ask the search for it.
        request: {
          method: 'GET',
          path: '/api/v1/json/search/galleries',
          query: { q: 'id:{id}', per_page: '1' },
        },
        notFoundWhenEmpty: '/galleries',
        joins: [
          {
            name: 'images',
            request: {
              method: 'GET',
              path: '/api/v1/json/search/images',
              // Sorting by `gallery_id:N` is the gallery's own order.
              query: {
                q: '{galleryQuery}',
                sf: 'gallery_id:{id}',
                sd: 'asc',
                page: '{page|1}',
                per_page: '{perPage|15}',
              },
            },
            collect: {
              param: 'galleryQuery',
              from: '/galleries',
              pick: '/id',
              prefix: 'gallery_id:',
              separator: ' || ',
            },
            items: '/images',
            key: '/id',
          },
        ],
        map: {
          id: '/galleries/0/id',
          title: '/galleries/0/title',
          description: '/galleries/0/description',
          spoilerWarning: '/galleries/0/spoiler_warning',
          thumbnailId: '/galleries/0/thumbnail_id',
          // Renamed from `user` to `creator` in Philomena 1.3.
          user: '/galleries/0/creator|/galleries/0/user',
          userId: '/galleries/0/creator_id|/galleries/0/user_id',
          page: { from: '$param:page', as: 'int' },
          perPage: { from: '$param:perPage', as: 'int' },
          imageTotal: { join: 'images', at: '/total' },
          images: { join: 'images', map: mediaFields() },
        },
      },
    ],
  },
});

export const suggestTags = defineOperation({
  operationId: 'suggestTags',
  path: '/tags/suggest',
  method: 'get',
  summary: 'Tag suggestions for the start of a tag name, for the search box.',
  tags: ['tags'],
  params: [
    {
      name: 'term',
      in: 'query',
      schema: s.string(),
      required: true,
      description: 'The start of a tag name. Upstream answers nothing for very short terms.',
    },
  ],
  response: s.ref('TagSuggestionList'),
  examples: { term: 'saf' },
  // Typing triggers it, so keep it short-lived but shared between visitors.
  philomena: {
    routes: ['GET /autocomplete/tags'],
    auth: 'none',
    cacheSeconds: 300,
    strategies: [
      {
        kind: 'json',
        // The page-level route, not under `/api`: Derpibooru's sits behind the bot challenge.
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/autocomplete/tags', query: { term: '{term}' } },
        map: { items: { from: '', map: { label: '/label', tag: '/value' } } },
      },
    ],
  },
});

export const listUserFilters = defineOperation({
  operationId: 'listUserFilters',
  path: '/filters/user',
  method: 'get',
  summary: "The signed-in user's own filters. Also the way to check that an API key works.",
  tags: ['filters'],
  params: [],
  response: s.ref('FilterList'),
  examples: {},
  philomena: {
    routes: ['GET /api/v1/json/filters/user'],
    auth: 'api-key',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/filters/user' },
        map: { items: { from: '/filters', map: filterMap } },
      },
    ],
  },
});
