import { useQuery } from '@tanstack/react-query';
import type { QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

import { useDataSource } from '#/hooks/use-data-source';
import type { DataSourceKind } from '#/lib/api/types';

/**
 * A query for a page that has no mock: it runs on the live source and not at
 * all on the others, where the page says so instead.
 */
export function useLiveQuery<TData, TKey extends QueryKey>(
  options: UseQueryOptions<TData, Error, TData, TKey>,
): UseQueryResult<TData> & { kind: DataSourceKind } {
  const kind = useDataSource();
  const query = useQuery({ ...options, enabled: kind === 'live' });

  return { ...query, kind };
}
