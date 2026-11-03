import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';
import { communicationFields } from './communication.ts';
import { postMap, under } from './maps.ts';
import { urlAt } from './media.ts';

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

/** The topic page: the topic and one page of its posts, at the site's own path. */
export const getTopic = defineOperation({
  operationId: 'getTopic',
  path: '/forums/{forum}/topics/{topic}',
  method: 'get',
  summary: 'The topic page: the topic and one page of its posts.',
  tags: ['forums'],
  params: [
    forumParam,
    topicParam,
    { name: 'page', in: 'query', schema: s.int(), description: 'Posts come 25 to a page.' },
  ],
  response: s.ref('TopicPage'),
  examples: { forum: 'dis', topic: 'example-topic' },
  philomena: {
    routes: ['GET /forums/:forum_id/topics/:id', 'GET /api/v1/json/forums/:forum_id/topics/:id'],
    auth: 'none',
    strategies: [
      {
        // Rendered text for the posts, as the site's own page has it.
        kind: 'html',
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/forums/{forum}/topics/{topic}', query: { page: '{page|1}' } },
        template: 'lib/philomena_web/templates/topic/show.html.slime',
        select: {
          fields: {
            slug: { sel: '.block__header a[href*="/topics/"]', attr: 'href', as: 'lastSegment' },
            title: { sel: 'main h1', text: true },
            forumSlug: { sel: '.block__header > a[href^="/forums/"]', attr: 'href', as: 'lastSegment' },
            forumName: { sel: '.block__header > a[href^="/forums/"]', text: true },
            author: { sel: '.page__options strong', text: true },
            startedAt: { sel: '.page__info time', attr: 'datetime' },
            // "1 replies" counts the posts after the first.
            postCount: {
              sel: '.page__info .flex--center-distributed > .block__header__item:nth-child(2)',
              text: true,
              as: 'add:1',
            },
            posts: { sel: 'article.communication', many: true, fields: communicationFields() },
          },
        },
      },
      {
        // Derpibooru's pages sit behind a bot challenge: the JSON API has the
        // topic and its posts, as the markup the authors wrote.
        kind: 'json',
        flavors: ['derpibooru'],
        request: { method: 'GET', path: '/api/v1/json/forums/{forum}/topics/{topic}' },
        joins: [
          {
            name: 'posts',
            request: {
              method: 'GET',
              path: '/api/v1/json/forums/{forum}/topics/{topic}/posts',
              query: { page: '{page|1}', per_page: '25' },
            },
            items: '/posts',
            key: '/id',
          },
          {
            name: 'forum',
            request: { method: 'GET', path: '/api/v1/json/forums/{forum}' },
            items: '',
            key: '',
          },
        ],
        map: {
          slug: '/topic/slug',
          title: '/topic/title',
          forumSlug: { join: 'forum', at: '/forum/short_name' },
          forumName: { join: 'forum', at: '/forum/name' },
          author: '/topic/author',
          postCount: '/topic/post_count',
          posts: {
            join: 'posts',
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

/** A forum's topics, as its page lists them. */
export const listForumTopics = defineOperation({
  operationId: 'listForumTopics',
  path: '/forums/{forum}/topics',
  method: 'get',
  summary: 'The topics of a forum, stickies first and then the most recently replied to.',
  tags: ['forums'],
  params: [
    forumParam,
    { name: 'page', in: 'query', schema: s.int() },
    { name: 'perPage', in: 'query', schema: s.int(), description: 'At most 50.' },
  ],
  response: s.ref('TopicResults'),
  examples: { forum: 'dis', perPage: 5 },
  philomena: {
    routes: ['GET /api/v1/json/forums/:forum_id/topics', 'GET /forums/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: {
          method: 'GET',
          path: '/api/v1/json/forums/{forum}/topics',
          query: { page: '{page|1}', per_page: '{perPage|25}' },
        },
        map: {
          total: '/total',
          page: { from: '$param:page', as: 'int' },
          perPage: { from: '$param:perPage', as: 'int' },
          items: { from: '/topics', map: topicMap },
        },
      },
    ],
  },
});

export const listTopicPosts = defineOperation({
  operationId: 'listTopicPosts',
  path: '/forums/{forum}/topics/{topic}/posts',
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
  path: '/forums/{forum}/topics/{topic}/posts/{post}',
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

export const listForums = defineOperation({
  operationId: 'listForums',
  path: '/forums',
  method: 'get',
  summary: 'The forums page: every forum with its description and counters.',
  tags: ['forums'],
  params: [],
  response: s.ref('ForumList'),
  examples: {},
  philomena: {
    routes: ['GET /api/v1/json/forums', 'GET /forums'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/forums' },
        map: {
          items: {
            from: '/forums',
            map: {
              slug: '/short_name',
              name: '/name',
              description: '/description',
              postCount: '/post_count',
              topicCount: '/topic_count',
            },
          },
        },
      },
    ],
  },
});
