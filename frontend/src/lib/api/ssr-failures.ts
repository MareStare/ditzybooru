import { hashKey } from '@tanstack/react-query';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Hashes of the queries that failed during SSR. The browser fills it. */
const failedOnServer = new Set<string>();

export function failedQueryHashes(queryClient: QueryClient): Array<string> {
  return queryClient
    .getQueryCache()
    .findAll({ predicate: query => query.state.status === 'error' })
    .map(query => query.queryHash);
}

export function markFailedOnServer(hashes: Array<string>): void {
  for (const hash of hashes) {
    failedOnServer.add(hash);
  }
}

/** Returns `true` only on the first call for a query that failed during SSR. */
export function takeFailedOnServer(queryKey: QueryKey): boolean {
  return failedOnServer.delete(hashKey(queryKey));
}
