import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';

/** The search page: one page of image results for a query. */
export const searchImages = defineOperation({
  operationId: 'searchImages',
  path: '/search',
  method: 'get',
  summary: 'Search images. Returns one page of results and the total match count.',
  tags: ['search'],
  params: [
    { name: 'q', in: 'query', schema: s.string(), description: 'Search query, `*` for everything.' },
    { name: 'page', in: 'query', schema: s.int() },
    { name: 'perPage', in: 'query', schema: s.int(), description: 'At most 50.' },
    { name: 'sf', in: 'query', schema: s.string(), description: 'Sort field, e.g. `created_at`.' },
    { name: 'sd', in: 'query', schema: s.enum('asc', 'desc') },
    { name: 'filterId', in: 'query', schema: s.int() },
  ],
  response: s.ref('SearchPage'),
  examples: { q: 'safe', perPage: 2 },
  philomena: {
    routes: ['GET /api/v1/json/search/images', 'GET /search'],
    auth: 'none',
    strategies: [
      {
        kind: 'json',
        request: {
          method: 'GET',
          path: '/api/v1/json/search/images',
          query: {
            q: '{q|*}',
            page: '{page|1}',
            per_page: '{perPage|15}',
            sf: '{sf|created_at}',
            sd: '{sd|desc}',
            filter_id: '{filterId}',
          },
        },
        map: {
          total: '/total',
          page: { from: '$param:page', as: 'int' },
          perPage: { from: '$param:perPage', as: 'int' },
          items: {
            from: '/images',
            map: {
              id: '/id',
              createdAt: '/created_at',
              width: '/width',
              height: '/height',
              aspectRatio: '/aspect_ratio',
              mimeType: '/mime_type',
              tags: '/tags',
              tagCount: '/tag_count',
              score: '/score',
              upvotes: '/upvotes',
              downvotes: '/downvotes',
              faves: '/faves',
              commentCount: '/comment_count',
              sourceUrls: '/source_urls',
              representations: {
                from: '/representations',
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
              spoilered: '/spoilered',
              hiddenFromUsers: '/hidden_from_users',
            },
          },
        },
      },
    ],
  },
});
