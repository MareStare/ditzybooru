import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';
import { urlAt } from './media.ts';
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
    routes: ['GET /api/v1/json/filters/:id'],
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
  path: '/profiles/{id}',
  method: 'get',
  summary: 'The profile page: a user with counters, linked tags and awards.',
  tags: ['profiles'],
  params: [{ name: 'id', in: 'path', schema: s.int(), required: true }],
  response: s.ref('Profile'),
  examples: { id: 4 },
  philomena: {
    routes: ['GET /api/v1/json/profiles/:id'],
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
