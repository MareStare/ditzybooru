import type { Operation } from './dsl/operation.ts';
import * as forums from './operations/forums.ts';
import * as images from './operations/images.ts';
import * as listings from './operations/listings.ts';
import * as search from './operations/search.ts';

export const operations: Operation[] = [
  ...Object.values(images),
  ...Object.values(search),
  ...Object.values(listings),
  ...Object.values(forums),
];
