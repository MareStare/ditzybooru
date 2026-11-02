import { s } from '../dsl/schema.ts';
import { listingOperation } from './listing.ts';
import { mediaFields } from './media.ts';

export const searchImages = listingOperation({
  operationId: 'searchImages',
  path: '/search',
  summary: 'The search page: one page of image results for a query.',
  resource: 'images',
  item: 'Media',
  itemsKey: 'images',
  htmlRoute: 'GET /search',
  examples: { q: 'safe', perPage: 2 },
  extraParams: [
    { name: 'sf', in: 'query', schema: s.string(), description: 'Sort field, e.g. `created_at`.' },
    { name: 'sd', in: 'query', schema: s.enum('asc', 'desc') },
    { name: 'filterId', in: 'query', schema: s.int() },
  ],
  extraQuery: { sf: '{sf|created_at}', sd: '{sd|desc}', filter_id: '{filterId}' },
  itemMap: mediaFields(),
});
