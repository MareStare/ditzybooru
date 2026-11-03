import { definePlugin } from 'nitro';
import { useNitroHooks } from 'nitro/app';

/**
 * Nitro gives everything under `/assets/` the one-year `immutable`
 * cache header, found or not. A request for an asset the running server does
 * not have (the new page arriving while the old build is still up, mid-deploy)
 * is a 404 carrying that header, and Cloudflare keeps it for a year: the file
 * stays "missing" at that edge after it exists. A 404 is never worth keeping.
 */
export default definePlugin(() => {
  useNitroHooks().hook('response', response => {
    if (response.status === 404) {
      response.headers.set('cache-control', 'no-store');
    }
  });
});
