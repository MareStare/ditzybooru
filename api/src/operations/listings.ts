import { s } from '../dsl/schema.ts';
import { listingOperation } from './listing.ts';
import { commentMap, filterMap, postMap, tagMap } from './maps.ts';

export const listTags = listingOperation({
  operationId: 'listTags',
  path: '/tags',
  summary: 'The tags page: tags matching a query, with their metadata.',
  resource: 'tags',
  item: 'Tag',
  itemsKey: 'tags',
  htmlRoute: 'GET /tags',
  itemMap: tagMap,
});

export const listComments = listingOperation({
  operationId: 'listComments',
  path: '/comments',
  summary: 'The comments page: image comments matching a query.',
  resource: 'comments',
  item: 'Comment',
  itemsKey: 'comments',
  htmlRoute: 'GET /comments',
  extraParams: [
    { name: 'sf', in: 'query', schema: s.string(), description: 'Sort field, e.g. `created_at`.' },
    { name: 'sd', in: 'query', schema: s.enum('asc', 'desc') },
  ],
  extraQuery: { sf: '{sf|created_at}', sd: '{sd|desc}' },
  itemMap: {
    ...commentMap,
    // Null when the active filter hides the image.
    imageThumbTiny: {
      join: 'images',
      key: '/image_id',
      value: '/representations/thumb_tiny',
      as: 'url',
    },
  },
  joins: [
    {
      name: 'images',
      request: {
        method: 'GET',
        path: '/api/v1/json/search/images',
        query: { q: '{imageIds}', per_page: '{imageIdsCount}' },
      },
      collect: { param: 'imageIds', from: '/comments', pick: '/image_id', prefix: 'id:', separator: ' || ' },
      items: '/images',
      key: '/id',
    },
  ],
});

export const listPosts = listingOperation({
  operationId: 'listPosts',
  path: '/posts',
  summary: 'The posts page: forum posts matching a query.',
  resource: 'posts',
  item: 'Post',
  itemsKey: 'posts',
  htmlRoute: 'GET /posts',
  itemMap: postMap,
});

export const listGalleries = listingOperation({
  operationId: 'listGalleries',
  path: '/galleries',
  summary: 'The galleries page: galleries matching a query.',
  resource: 'galleries',
  item: 'Gallery',
  itemsKey: 'galleries',
  htmlRoute: 'GET /galleries',
  itemMap: {
    id: '/id',
    title: '/title',
    description: '/description',
    spoilerWarning: '/spoiler_warning',
    thumbnailId: '/thumbnail_id',
    // Renamed from `user` to `creator` in Philomena 1.3.
    user: '/creator|/user',
    userId: '/creator_id|/user_id',
  },
});

export const listFilters = listingOperation({
  operationId: 'listFilters',
  path: '/filters',
  summary: 'The filters page: public filters matching a query.',
  resource: 'filters',
  item: 'Filter',
  itemsKey: 'filters',
  htmlRoute: 'GET /filters',
  itemMap: filterMap,
});
