import type { Operation } from './dsl/operation.ts';
import * as channels from './operations/channels.ts';
import * as forums from './operations/forums.ts';
import * as images from './operations/images.ts';
import * as items from './operations/items.ts';
import * as listings from './operations/listings.ts';
import * as pages from './operations/pages.ts';
import * as search from './operations/search.ts';

export const operations: Operation[] = [
  ...Object.values(channels),
  ...Object.values(images),
  ...Object.values(search),
  ...Object.values(items),
  ...Object.values(listings),
  ...Object.values(forums),
  ...Object.values(pages),
];
