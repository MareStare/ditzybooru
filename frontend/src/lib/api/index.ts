import { mockSource } from '#/lib/api/mock';
import { philomenaSource } from '#/lib/api/philomena';
import type { DataSource, DataSourceKind } from '#/lib/api/types';

export function dataSource(kind: DataSourceKind): DataSource {
  return kind === 'mock' ? mockSource : philomenaSource;
}
