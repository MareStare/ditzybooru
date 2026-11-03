import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';

import { useDataSource } from '#/hooks/use-data-source';
import { useInView } from '#/hooks/use-in-view';
import { apiKeyFingerprint, useApiKey } from '#/lib/api/api-key';
import { watchedMediaQuery } from '#/lib/api/queries';
import { currentUser } from '#/lib/api/session';
import { MediaGrid } from './MediaGrid';

/** How many images the block holds. */
const WATCHED_COUNT = 12;

/**
 * "Watched Images" block shown in the main column when the user is signed in
 * and has any watched tags. Mirrors Philomena's watched-images section: a
 * compact grid.
 *
 * Signed in means a mock user in the mock sources, and a saved API key on a
 * live one. The key lives in the browser only, so the live block can only load
 * there: once it is near the viewport, and never for a visitor without a key.
 */
export function WatchedImages() {
  const kind = useDataSource();
  const apiKey = useApiKey();
  const [ref, inView] = useInView();
  const signedIn = kind === 'live' ? apiKey !== null : currentUser(kind) !== null;
  const { data } = useQuery({
    ...watchedMediaQuery(kind, WATCHED_COUNT, apiKey === null ? '' : apiKeyFingerprint(apiKey)),
    enabled: signedIn && inView,
  });

  if (!signedIn || data?.images.length === 0) {
    return null;
  }

  return (
    <div ref={ref}>
      <MediaGrid
        size="small"
        label="Watched"
        icon={<Eye size={16} />}
        images={data?.images ?? []}
        total={data?.total ?? 0}
      />
    </div>
  );
}
