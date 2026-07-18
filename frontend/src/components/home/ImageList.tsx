import type { ReactNode } from 'react';
import { Settings, Shuffle } from 'lucide-react';

import type { Image } from '#/lib/types';
import { Button } from '#/components/ui/button';
import { formatCount } from '#/lib/format';
import { MediaBox } from './MediaBox';
import { Pagination } from './Pagination';

interface ImageListProps {
  title: string;
  images: Array<Image>;
  total: number;
  /** Extra controls rendered on the right of the header (e.g. watched link). */
  headerActions?: ReactNode;
}

function DisplaySettingsLink() {
  return (
    <a
      href="/settings/edit"
      title="Display Settings"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <Settings className="size-4" />
      <span className="hidden sm:inline">Display Settings</span>
    </a>
  );
}

/**
 * The main image gallery: a titled block with pagination, a responsive
 * thumbnail grid and a results footer. Mirrors Philomena's image `index`.
 */
export function ImageList({ title, images, total, headerActions }: ImageListProps) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-3 py-2.5">
        <h1 className="text-base font-semibold">{title}</h1>
        <Pagination className="hidden md:flex" />
        <div className="ml-auto flex items-center gap-2">
          {headerActions}
          <a href="/images/random" title="Random Image">
            <Button variant="outline" size="sm">
              <Shuffle />
              <span className="hidden sm:inline">Random</span>
            </Button>
          </a>
        </div>
      </header>

      {/* Match Philomena: fixed ~225px thumbnails (150px below 1150px) that
          add columns as the viewport widens, rather than stretching. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 p-3 min-[1150px]:grid-cols-[repeat(auto-fill,minmax(225px,1fr))]">
        {images.map(image => (
          <MediaBox key={image.id} image={image} />
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t bg-muted/30 px-3 py-2.5">
        <Pagination />
        <span className="text-sm text-muted-foreground">
          Showing <strong className="text-foreground">1&ndash;{images.length}</strong> of{' '}
          <strong className="text-foreground">{formatCount(total)}</strong> total
        </span>
        <div className="ml-auto">
          <DisplaySettingsLink />
        </div>
      </footer>
    </section>
  );
}
