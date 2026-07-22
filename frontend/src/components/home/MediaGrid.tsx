import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';

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
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // The active tab is wrapped in the section heading
  // so the page keeps a single logical heading as tabs switch.
  const Heading = `h${headingLevel}` as const;

  const active = unwrap(tabs[activeTab]);
  // With a single tab there's nothing to switch to, so render the label as
  // static heading text instead of an interactive dropdown.
  const hasDropdown = tabs.length > 1;
  const page = unwrap(pages[activeTab]);
  const setPage = (next: number) => {
    setPages(prev => prev.map((p, i) => (i === activeTab ? next : p)));
  };

  // Close the tab dropdown on an outside click or the Escape key.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-t-xl bg-card-header px-3 text-card-header-foreground">
        {/* The active tab doubles as the section heading, so the page keeps a
            single logical heading as the dropdown switches views. */}
        <Heading>
          {!hasDropdown ? (
            <span className="py-2 inline-flex items-center gap-1.5 px-2.5 text-sm font-semibold text-card-header-foreground">
              {active.icon}
              {active.label}
            </span>
          ) : (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                title="Switch image view"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => {
                  setOpen(prev => !prev);
                }}
                className="py-2 inline-flex items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-card-header-foreground transition-colors hover:bg-white/10"
              >
                {active.icon}
                {active.label}
                <ChevronDown className={cn('size-3.5 opacity-70 transition-transform', open ? 'rotate-180' : null)} />
              </button>

              {open ? (
                // Dark panel matching the header instead of the light popover, so
                // the menu reads as an extension of the card header.
                <div
                  role="menu"
                  aria-label="Image views"
                  className="absolute left-0 top-full z-30 mt-1 min-w-48 origin-top rounded-lg border border-white/10 bg-card-header p-1 text-card-header-foreground shadow-lg"
                >
                  {tabs.map((tab, index) => {
                    const selected = index === activeTab;
                    return (
                      <button
                        key={index}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        title={`Browse ${tab.label}`}
                        onClick={() => {
                          setActiveTab(index);
                          setOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-1.5 rounded-md py-1.5 px-2.5 text-sm transition-colors',
                          selected
                            ? 'bg-white/8 font-semibold text-card-header-foreground'
                            : 'text-card-header-foreground/70 hover:bg-white/10 hover:text-card-header-foreground',
                        )}
                      >
                        {tab.icon}
                        {tab.label}
                        <Check className={cn('ml-auto size-4', selected ? null : 'invisible')} />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </Heading>
      </header>

      {/* Match Philomena's image list: auto-fill adds thumbnail columns as the
          viewport widens instead of stretching a fixed number of columns. */}
      <div className={cn('grid gap-2 py-2', GRID_SIZES[size])}>
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
