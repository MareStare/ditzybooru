import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';

export const getImage = defineOperation({
  operationId: 'getImage',
  path: '/images/{id}',
  method: 'get',
  summary: 'Fetch one image with its metadata.',
  tags: ['images'],
  params: [{ name: 'id', in: 'path', schema: s.int(), required: true }],
  response: s.ref('Image'),
  examples: { id: 1 },
  philomena: {
    routes: ['GET /api/v1/json/images/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: { method: 'GET', path: '/api/v1/json/images/{id}' },
        map: {
          id: '/image/id',
          createdAt: '/image/first_seen_at',
          width: '/image/width',
          height: '/image/height',
          aspectRatio: '/image/aspect_ratio',
          format: '/image/format',
          tags: '/image/tags',
          tagCount: '/image/tag_count',
          score: '/image/score',
          upvotes: '/image/upvotes',
          downvotes: '/image/downvotes',
          faves: '/image/faves',
          commentCount: '/image/comment_count',
          sourceUrls: '/image/source_urls',
          description: '/image/description',
          uploader: '/image/uploader',
          spoilered: '/image/spoilered',
          hiddenFromUsers: '/image/hidden_from_users',
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
        },
      },
    ],
  },
});
