import { currentUser as mockCurrentUser } from '#/lib/mock/data';
import type { DataSourceKind } from '#/lib/api/types';
import type { User } from '#/lib/types';

/**
 * The signed-in user, or `null` when browsing anonymously.
 *
 * Sign-in is not built yet, so every live request is anonymous: no faves, no
 * votes, no watched tags. The mock source keeps a signed-in user so the pages
 * that only exist for one can still be worked on.
 */
export function currentUser(kind: DataSourceKind): User | null {
  return kind === 'mock' ? mockCurrentUser : null;
}
