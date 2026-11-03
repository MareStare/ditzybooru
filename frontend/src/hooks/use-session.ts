import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchSession, signOut } from '#/lib/api/backend/session';
import type { Session } from '#/lib/api/backend/session';
import { useDataSource } from '#/hooks/use-data-source';

export const SESSION_QUERY_KEY = ['session'] as const;

/**
 * Who the visitor is on the site. Browser only: the session cookie lives in
 * the browser, so the server render is always signed out and the page fills in
 * once this answers. `undefined` until then, and on the mock sources.
 */
export function useSession(): Session | undefined {
  const kind = useDataSource();
  const { data } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    enabled: kind === 'live' && typeof window !== 'undefined',
    // A sign-in elsewhere (another tab) shows up when the window is focused.
    staleTime: 60_000,
  });

  return data;
}

/** Signs the visitor out of the site, then shows the signed-out page. */
export function useSignOut(): () => void {
  const queryClient = useQueryClient();

  return () => {
    void signOut().then(session => {
      queryClient.setQueryData(SESSION_QUERY_KEY, session);
    });
  };
}
