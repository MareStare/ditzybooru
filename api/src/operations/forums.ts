import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';

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
