/**
 * The site the current request is for.
 *
 * The server works it out from the `Host` header. The browser cannot know the
 * config, so the server hands the site over with the dehydrated router state
 * (`router.tsx`) before anything reads it.
 */

import { createIsomorphicFn } from '@tanstack/react-start';

import { unwrap } from '#/lib/assertions';
import { requestSite } from '#/lib/sites.server';
import type { Site } from '#/lib/sites';

let browserSite: Site | undefined;

export function setBrowserSite(site: Site): void {
  browserSite = site;
}

export const currentSite = createIsomorphicFn()
  .server((): Site => requestSite())
  .client((): Site => unwrap(browserSite));
