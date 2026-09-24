import { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import { routeTree } from './route-tree.gen';

/**
 * How long a fetched answer is served without asking the origin again.
 *
 * Philomena rate-limits per IP, and the server render shares one address with
 * every other visitor, so a minute-old listing is a fair trade.
 */
const STALE_TIME_MS = 60_000;

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: STALE_TIME_MS } },
  });

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    // Query owns the cache. A second copy in the router would answer the same
    // question with staler data depending on which one was asked.
    defaultPreloadStaleTime: 0,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
