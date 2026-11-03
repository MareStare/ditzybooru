import { useDataSource } from '#/hooks/use-data-source';
import { useSession } from '#/hooks/use-session';
import { currentUser } from '#/lib/api/session';
import type { User } from '#/lib/types';

/** The signed-in user: the visitor's own session on the live source, a made-up one on the mock. */
export function useCurrentUser(): User | null {
  const kind = useDataSource();
  const session = useSession();
  if (kind !== 'live') {
    return currentUser(kind);
  }
  if (session?.signedIn !== true || session.id === null || session.name === null) {
    return null;
  }

  return { id: session.id, name: session.name, slug: session.slug ?? session.name, avatarUrl: session.avatarUrl };
}
