import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';
import { postMap, under } from './maps.ts';

/** The latest topics across all forums, for the home page's forum block. */
export const getForumActivity = defineOperation({
  operationId: 'getForumActivity',
  path: '/forum-activity',
  method: 'get',
  summary: 'Recently active forum topics across every forum, newest reply first.',
  tags: ['forums'],
  params: [{ name: 'limit', in: 'query', schema: s.int(), description: 'At most 50. Default 6.' }],
  response: s.ref('ForumActivity'),
  examples: { limit: 4 },
  philomena: {
    routes: ['GET /api/v1/json/forums', 'GET /api/v1/json/forums/:forum_id/topics'],
    auth: 'none',
    // One block load asks every forum, so keep it longer than a listing.
    cacheSeconds: 120,
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/forums' },
        // One request per forum for its latest topics, then merged by last reply.
        fanout: {
          from: '/forums',
          request: {
            method: 'GET',
            path: '/api/v1/json/forums/{forum}/topics',
            query: { page: '1', per_page: '{limit|6}' },
          },
          bind: { forum: '/short_name' },
          items: '/topics',
          sortBy: '/last_replied_to_at',
          descending: true,
          limit: 'limit',
        },
        map: {
          items: {
            from: '/items',
            map: {
              slug: '/item/slug',
              title: '/item/title',
              sticky: '/item/sticky',
              locked: '/item/locked',
              postCount: '/item/post_count',
              lastRepliedAt: '/item/last_replied_to_at',
              author: '/item/author',
              authorId: '/item/user_id',
              forum: { from: '/parent', map: { slug: '/short_name', name: '/name' } },
            },
          },
        },
      },
    ],
  },
});

const topicMap = {
  slug: '/slug',
  title: '/title',
  sticky: '/sticky',
  locked: '/locked',
  postCount: '/post_count',
  viewCount: '/view_count',
  lastRepliedAt: '/last_replied_to_at',
  author: '/author',
  authorId: '/user_id',
};

const forumParam = { name: 'forum', in: 'path', schema: s.string(), required: true } as const;
const topicParam = { name: 'topic', in: 'path', schema: s.string(), required: true } as const;

export const getForum = defineOperation({
  operationId: 'getForum',
  path: '/forums/{forum}',
  method: 'get',
  summary: 'One forum: its name, description and counters.',
  tags: ['forums'],
  params: [forumParam],
  response: s.ref('Forum'),
  examples: { forum: 'dis' },
  philomena: {
    routes: ['GET /api/v1/json/forums/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/forums/{forum}' },
        map: under('/forum', {
          slug: '/short_name',
          name: '/name',
          description: '/description',
          postCount: '/post_count',
          topicCount: '/topic_count',
        }),
      },
    ],
  },
});

export const getTopic = defineOperation({
  operationId: 'getTopic',
  path: '/forums/{forum}/{topic}',
  method: 'get',
  summary: 'One forum topic: its title, flags and counters.',
  tags: ['forums'],
  params: [forumParam, topicParam],
  response: s.ref('Topic'),
  examples: { forum: 'dis', topic: 'example-topic' },
  philomena: {
    routes: ['GET /api/v1/json/forums/:forum_id/topics/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/forums/{forum}/topics/{topic}' },
        map: under('/topic', topicMap),
      },
    ],
  },
});

export const listTopicPosts = defineOperation({
  operationId: 'listTopicPosts',
  path: '/forums/{forum}/{topic}/posts',
  method: 'get',
  summary: 'The posts of a topic, oldest first.',
  tags: ['forums'],
  params: [
    forumParam,
    topicParam,
    { name: 'page', in: 'query', schema: s.int() },
    { name: 'perPage', in: 'query', schema: s.int(), description: 'At most 50.' },
  ],
  response: s.ref('PostResults'),
  examples: { forum: 'dis', topic: 'example-topic', perPage: 2 },
  philomena: {
    routes: ['GET /api/v1/json/forums/:forum_id/topics/:topic_id/posts'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: {
          method: 'GET',
          path: '/api/v1/json/forums/{forum}/topics/{topic}/posts',
          query: { page: '{page|1}', per_page: '{perPage|25}' },
        },
        map: {
          total: '/total',
          page: { from: '$param:page', as: 'int' },
          perPage: { from: '$param:perPage', as: 'int' },
          items: { from: '/posts', map: postMap },
        },
      },
    ],
  },
});

export const getPost = defineOperation({
  operationId: 'getPost',
  path: '/forums/{forum}/{topic}/posts/{post}',
  method: 'get',
  summary: 'One forum post.',
  tags: ['forums'],
  params: [forumParam, topicParam, { name: 'post', in: 'path', schema: s.int(), required: true }],
  response: s.ref('Post'),
  examples: { forum: 'dis', topic: 'example-topic', post: 1 },
  philomena: {
    routes: ['GET /api/v1/json/forums/:forum_id/topics/:topic_id/posts/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/forums/{forum}/topics/{topic}/posts/{post}' },
        map: under('/post', postMap),
      },
    ],
  },
});
