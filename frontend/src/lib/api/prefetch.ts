import { notFound } from '@tanstack/react-router';
import type { QueryClient, QueryKey, UseQueryOptions } from '@tanstack/react-query';

import { HttpError } from '#/lib/http/http-client';
import type { Settings } from '#/lib/settings';

/**
 * Fills the cache for a page that only exists on the live source, so the
 * server render has it. A failed fetch does not fail the page: the browser
 * asks again. A thing the site says is not there makes the response a 404.
 */
export async function prefetchLive<TData, TKey extends QueryKey>(
  context: { queryClient: QueryClient; settings: Settings },
  options: UseQueryOptions<TData, Error, TData, TKey>,
): Promise<void> {
  if (context.settings.dataSource !== 'live') {
    return;
  }
  await context.queryClient.query({ ...options, staleTime: 'static' }).catch((error: unknown) => {
    if (error instanceof HttpError && error.response.status === 404) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- how the router is told, see its docs
      throw notFound();
    }
  });
}
