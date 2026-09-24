import { useSettings } from '#/hooks/useSettings';
import type { DataSourceKind } from '#/lib/api/types';

/** Which backend the page being rendered reads from. Writes go through
 *  `lib/settingsStore`. */
export function useDataSource(): DataSourceKind {
  return useSettings().dataSource;
}
