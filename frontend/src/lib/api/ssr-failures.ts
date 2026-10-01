import { hashKey } from '@tanstack/react-query';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { HttpError } from '#/lib/http/http-client';

interface ServerFailure {
  queryHash: string;
  /** The request that failed, or the query key if no request failed. */
  reason: string;
}

/** Hashes of the queries that failed during SSR. The browser fills it. */
const failedHashes = new Set<string>();

export function serverFailures(queryClient: QueryClient): Array<ServerFailure> {
  return queryClient
    .getQueryCache()
    .findAll({ predicate: query => query.state.status === 'error' })
    .map(query => ({
      queryHash: query.queryHash,
      // Only HTTP errors go to the browser. Other errors can hold server details.
      reason: query.state.error instanceof HttpError ? query.state.error.message : `Query ${query.queryKey.join('/')}`,
    }));
}

export function markFailedOnServer(failures: Array<ServerFailure>): void {
  if (failures.length > 0) {
    const reasons = failures.map(failure => `- ${failure.reason}`).join('\n');
    console.warn(`${failures.length} queries failed on the server. The browser loads them instead:\n${reasons}`);
  }
  for (const failure of failures) {
    failedHashes.add(failure.queryHash);
  }
}

/** Whether the query failed during SSR. Works on both the server and the browser. */
export function failedOnServer(queryClient: QueryClient, queryKey: QueryKey): boolean {
  if (import.meta.env.SSR) {
    return queryClient.getQueryState(queryKey)?.status === 'error';
  }
  return failedHashes.has(hashKey(queryKey));
}

/** Returns `true` only on the first call for a query that failed during SSR. */
export function takeFailedOnServer(queryKey: QueryKey): boolean {
  return failedHashes.delete(hashKey(queryKey));
}
