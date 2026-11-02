import type { Operation } from './dsl/operation.ts';
import * as images from './operations/images.ts';

export const operations: Operation[] = [...Object.values(images)];
