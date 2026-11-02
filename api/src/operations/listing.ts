import type { JsonMap } from '../dsl/extract.ts';
import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';

interface ListingOptions {
  operationId: string;
  /** Our path, the same as the live site's page. */
  path: string;
  summary: string;
  /** Resource name in `/api/v1/json/search/<resource>`. */
  resource: string;
  /** Schema name of one item; the response schema is `<Item>Results`. */
  item: string;
  /** Our item field -> pointer into one upstream item. */
  itemMap: JsonMap;
  /** Key of the item array in the upstream response. */
  itemsKey: string;
  /** The page's HTML route, served by the same data. */
  htmlRoute: string;
  extraParams?: Parameters<typeof defineOperation>[0]['params'];
  /** Extra upstream query entries, for `extraParams`. */
  extraQuery?: Record<string, string>;
  examples?: Record<string, string | number>;
}

/** A paged listing page backed by the search API (`q`, `page`, `perPage`). */
export function listingOperation(options: ListingOptions) {
  const results = `${options.item}Results`;
  return defineOperation({
    operationId: options.operationId,
    path: options.path,
    method: 'get',
    summary: options.summary,
    tags: [options.resource],
    params: [
      { name: 'q', in: 'query', schema: s.string(), description: 'Search query, `*` for everything.' },
      { name: 'page', in: 'query', schema: s.int() },
      { name: 'perPage', in: 'query', schema: s.int(), description: 'At most 50.' },
      ...(options.extraParams ?? []),
    ],
    response: s.ref(results),
    examples: options.examples ?? { q: '*', perPage: 2 },
    philomena: {
      routes: [`GET /api/v1/json/search/${options.resource}`, options.htmlRoute],
      auth: 'none',
      strategies: [
        {
          kind: 'json',
          request: {
            method: 'GET',
            path: `/api/v1/json/search/${options.resource}`,
            query: {
              q: '{q|*}',
              page: '{page|1}',
              per_page: '{perPage|15}',
              ...options.extraQuery,
            },
          },
          map: {
            total: '/total',
            page: { from: '$param:page', as: 'int' },
            perPage: { from: '$param:perPage', as: 'int' },
            items: { from: `/${options.itemsKey}`, map: options.itemMap },
          },
        },
      ],
    },
  });
}
