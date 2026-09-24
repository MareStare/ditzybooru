import { useDataSource } from '#/hooks/useDataSource';
import { currentUser } from '#/lib/api/session';
import type { User } from '#/lib/types';

export function useCurrentUser(): User | null {
  return currentUser(useDataSource());
}
