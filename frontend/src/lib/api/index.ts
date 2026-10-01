import { mockSource } from '#/lib/api/mock';
import { directSource } from '#/lib/api/philomena/endpoints';
import { philomenaSource } from '#/lib/api/philomena/source.functions';
import type { DataSource, DataSourceKind } from '#/lib/api/types';

/** With `serverFallback: false`, a failed call from the browser does not go to
 *  the server. */
export function dataSource(kind: DataSourceKind, serverFallback = true): DataSource {
  if (kind === 'mock') {
    return mockSource;
  }

  return serverFallback ? philomenaSource : directSource;
}
