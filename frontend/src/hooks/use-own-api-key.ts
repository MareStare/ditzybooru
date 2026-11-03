import { useEffect } from 'react';

import { useSession } from '#/hooks/use-session';
import { apiKeyIsAutomatic, getApiKey, setApiKey } from '#/lib/api/api-key';
import { fetchOwnApiKey } from '#/lib/api/backend/session';

/**
 * Keeps the visitor's API key without asking for it. Signed in by cookie, the
 * site will show them their key, so we read it once and save it in this browser
 * for the requests that need one. A key they typed in is left alone; one we
 * fetched goes when they sign out. Mounted once, near the root.
 */
export function useOwnApiKey(): void {
  const session = useSession();
  const signedIn = session === undefined ? undefined : session.signedIn;

  useEffect(() => {
    if (signedIn === true && getApiKey() === null) {
      void fetchOwnApiKey().then(
        key => {
          setApiKey(key, { automatic: true });
        },
        () => undefined,
      );
    } else if (signedIn === false && apiKeyIsAutomatic()) {
      setApiKey(null);
    }
  }, [signedIn]);
}
