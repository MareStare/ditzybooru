import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';

import type { Media } from '#/lib/types';
import { unwrap } from '#/lib/assertions';
import { Int } from '#/components/ui/int';
import { cn } from '#/lib/utils';
import { MediaBox } from './MediaBox';
import { Pagination } from './Pagination';

/** Thumbnail grid sizing presets. */
const GRID_SIZES = {
  /** Fixed ~150px thumbnails — used for compact lists like watched images. */
  small: 'grid-cols-[repeat(auto-fill,minmax(150px,1fr))]',
  /** ~150px thumbnails that grow to ~225px on wide viewports (Philomena's main list). */
  large: 'grid-cols-[repeat(auto-fill,minmax(150px,1fr))] min-[1150px]:grid-cols-[repeat(auto-fill,minmax(225px,1fr))]',
} as const;

type ImageGridSize = keyof typeof GRID_SIZES;

/** One switchable view within an {@link ImageGrid}. */
export interface ImageGridTab {
  /** Search query backing this tab; identifies the view it would fetch. */
  query: string;
  /** Human-readable label rendered on the tab. */
  label: string;
  images: Array<Media>;
  total: number;
  /** Optional icon rendered before the label. */
  icon?: ReactNode;
}

interface ImageGridProps {
  /** The tabs to render; the first one is selected initially. */
  tabs: Array<ImageGridTab>;
  /** Heading level, so the page keeps a single logical `h1`. */
  headingLevel?: 1 | 2;
  /** Thumbnail grid sizing preset. */
  size?: ImageGridSize;
}

/**
 * A tabbed image gallery: a row of tabs, pagination, a responsive thumbnail
 * grid and a results footer. Each tab is a distinct query (recently uploaded,
 * top, random, …) and keeps its own current page, preserved while switching
 * between tabs. Mirrors Philomena's image `index`.
 */
export function ImageGrid({ tabs, headingLevel = 2, size = 'large' }: ImageGridProps) {
  const [activeTab, setActiveTab] = useState(0);
  // Each tab keeps its own current page, preserved as the user switches tabs.
  const [pages, setPages] = useState<Array<number>>(() => tabs.map(() => 1));

  // The active tab is wrapped in the section heading
  // so the page keeps a single logical heading as tabs switch.
  const Heading = `h${headingLevel}` as const;

  const active = unwrap(tabs[activeTab]);
  const page = unwrap(pages[activeTab]);
  const setPage = (next: number) => {
    setPages(prev => prev.map((p, i) => (i === activeTab ? next : p)));
  };

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1" aria-label="Image views">
          {tabs.map((tab, index) => {
            const selected = index === activeTab;
            const button = (
              <button
                type="button"
                title={`Browse ${tab.label}`}
                aria-current={selected ? 'page' : undefined}
                onClick={() => {
                  setActiveTab(index);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors',
                  selected
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );

            return selected ? <Heading key={index}>{button}</Heading> : <Fragment key={index}>{button}</Fragment>;
          })}
        </div>
      </header>

      {/* Match Philomena's image list: auto-fill adds thumbnail columns as the
          viewport widens instead of stretching a fixed number of columns. */}
      <div className={cn('grid gap-2 p-3', GRID_SIZES[size])}>
        {active.images.map(image => (
          <MediaBox key={image.id} image={image} />
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-b-xl border-t bg-card px-3 py-2.5">
        <Pagination page={page} onPageChange={setPage} />
        <span className="text-sm text-muted-foreground">
          Showing{' '}
          <strong className="text-foreground">
            1<span className="px-0.5">&ndash;</span>
            {active.images.length}
          </strong>{' '}
          of <Int className="text-foreground font-bold" value={active.total} /> total
        </span>
      </footer>
    </section>
  );
}
