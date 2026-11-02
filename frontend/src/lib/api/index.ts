import { apiSource } from '#/lib/api/backend/source';
import { mockSource } from '#/lib/api/mock';
import type { DataSource, DataSourceKind } from '#/lib/api/types';

export function dataSource(kind: DataSourceKind): DataSource {
  return kind === 'mock' || kind === 'mock-anonymous' ? mockSource : apiSource;
}
