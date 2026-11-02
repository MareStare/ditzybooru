import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';
import { commentMap, filterMap, under } from './maps.ts';

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
