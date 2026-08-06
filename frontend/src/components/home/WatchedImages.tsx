import { Eye } from 'lucide-react';

import { watchedImages } from '#/lib/mock/data';
import { MediaGrid } from './MediaGrid';

/**
 * "Watched Images" block shown in the main column when the user is signed in
 * and has any watched tags. Mirrors Philomena's watched-images section: a
 * compact grid.
 */
export function WatchedImages() {
  if (watchedImages.length === 0) {
    return null;
  }

  return (
    <MediaGrid
      size="small"
      label="Watched"
      icon={<Eye size={16} />}
      images={watchedImages}
      total={watchedImages.length}
    />
  );
}
