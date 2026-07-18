import { Eye } from 'lucide-react';

import { watchedImages } from '#/lib/mock/data';
import { MediaBox } from './MediaBox';

/**
 * "Watched Images" block shown in the main column when the user is signed in
 * and has any watched tags. Mirrors Philomena's watched-images section.
 */
export function WatchedImages() {
  if (watchedImages.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center justify-between border-b px-3 py-2.5">
        <h2 className="inline-flex items-center gap-1.5 text-base font-semibold">
          <Eye className="size-4 text-primary" />
          Watched Images
        </h2>
        <a
          href="/search?q=my:watched"
          title="Browse Watched Images"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Eye className="size-4" />
          <span className="hidden sm:inline">Browse Watched Images</span>
        </a>
      </header>
      {/* Philomena renders watched images with the smaller 150px media-list. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 p-3">
        {watchedImages.map(image => (
          <MediaBox key={image.id} image={image} />
        ))}
      </div>
    </section>
  );
}
