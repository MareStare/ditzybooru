import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import type { Media } from '#/lib/types';
import { unwrap } from '#/lib/assertions';
import { Int } from '#/components/ui/Int';
import { Pagination } from '#/components/ui/Pagination';
import { Panel, PanelHeader, PanelTab, PanelTabs } from '#/components/ui/Panel';
import { cn } from '#/lib/utils';
import { MediaBox } from './MediaBox';

/** Thumbnail grid sizing presets. */
type MediaGridSize =
  /** Fixed ~150px thumbnails — used for compact lists like watched images. */
  | 'small'
  /** ~150px thumbnails that grow to ~225px on wide viewports (Philomena's main list). */
  | 'large';

/** One switchable view within an {@link MediaGrid}. */
export interface MediaGridTab {
  /** Search query backing this tab; identifies the view it would fetch. */
  query: string;
  /** Human-readable label rendered on the tab. */
  label: string;
  images: Array<Media>;
  total: number;
  /** Optional icon rendered before the label. */
  icon?: ReactNode;
}

interface MediaGridProps {
  /** The tabs to render; the first one is selected initially. */
  tabs: Array<MediaGridTab>;
  /** Heading level, so the page keeps a single logical `h1`. */
  headingLevel?: 1 | 2;
  /** Thumbnail grid sizing preset. */
  size?: MediaGridSize;
}

/**
 * A tabbed image gallery: a tab strip doubling as the panel's title bar, a
 * responsive thumbnail grid, and a footer with pagination and the result count.
 * Each tab is a distinct query (recently uploaded, top, random, …) and keeps its
 * own current page, preserved while switching between tabs. Mirrors Philomena's
 * image `index`.
 */
export function MediaGrid({ tabs, headingLevel = 2, size = 'large' }: MediaGridProps) {
  const [activeTab, setActiveTab] = useState(0);
  // Each tab keeps its own current page, preserved as the user switches tabs.
  const [pages, setPages] = useState<Array<number>>(() => tabs.map(() => 1));
  const baseId = useId();

  const active = unwrap(tabs[activeTab]);
  // With a single tab there is nothing to switch to, so the label is a plain
  // panel header rather than a one-item tablist.
  const hasTabs = tabs.length > 1;
  const page = unwrap(pages[activeTab]);

  // Fabricated in this mockup: the API does not report a page count yet, so it
  // is inferred from the total and the size of the page we were handed.
  const pageCount = Math.max(1, Math.ceil(active.total / Math.max(active.images.length, 1)));

  // The heading is visually redundant with the tab strip, but the page still
  // needs one logical heading per section for the document outline.
  const Heading = `h${headingLevel}` as const;

  const tabId = (index: number) => `${baseId}-tab-${index}`;
  const panelId = (index: number) => `${baseId}-panel-${index}`;

  return (
    <Panel>
      <Heading className="visually-hidden">{active.label}</Heading>

      {hasTabs ? (
        <PanelTabs label="Image views">
          {tabs.map((tab, index) => (
            <PanelTab
              key={tab.label}
              id={tabId(index)}
              controls={panelId(index)}
              selected={index === activeTab}
              title={`Browse ${tab.label}`}
              onSelect={() => {
                setActiveTab(index);
              }}
            >
              {tab.icon}
              {tab.label}
            </PanelTab>
          ))}
        </PanelTabs>
      ) : (
        <PanelHeader>
          {active.icon}
          {active.label}
        </PanelHeader>
      )}

      <div
        id={panelId(activeTab)}
        role={hasTabs ? 'tabpanel' : undefined}
        aria-labelledby={hasTabs ? tabId(activeTab) : undefined}
        className={cn('media-grid', `media-grid--${size}`)}
      >
        {active.images.map(image => (
          <MediaBox key={image.id} image={image} />
        ))}
      </div>

      <footer className="media-grid__footer">
        <Pagination
          label={active.label}
          page={page}
          pageCount={pageCount}
          onPageChange={next => {
            setPages(prev => prev.map((p, i) => (i === activeTab ? next : p)));
          }}
        />
        <span className="media-grid__count">
          Showing{' '}
          <strong>
            1&ndash;
            {active.images.length}
          </strong>{' '}
          of{' '}
          <strong>
            <Int value={active.total} />
          </strong>{' '}
          total
        </span>
      </footer>
    </Panel>
  );
}
