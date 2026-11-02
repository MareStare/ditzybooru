import { createContext, use } from 'react';

import { unwrap } from '#/lib/assertions';
import type { Site } from '#/lib/sites';

/** The site for the request being rendered, published by the root route. */
export const SiteContext = createContext<Site | null>(null);

/** Which Philomena site is being shown: its name, logo and origin. */
export function useSite(): Site {
  return unwrap(use(SiteContext));
}
