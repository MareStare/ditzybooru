import { useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { Link } from '@tanstack/react-router';
import { MonitorCog, SlidersHorizontal } from 'lucide-react';

import type { Media } from '#/lib/types';
import { ComponentSettingsControls } from '#/components/layout/ComponentSettings';
import { Button } from '#/components/ui/Button';
import { Dropdown } from '#/components/ui/Dropdown';
import { Int } from '#/components/ui/Int';
import { Pagination } from '#/components/ui/Pagination';
import { Panel, PanelHeader } from '#/components/ui/Panel';
import { useComponentSettings } from '#/hooks/useComponentSettings';
import { MEDIA_GRID_SETTING_CONTROLS } from '#/lib/componentSettings';
import { cn } from '#/lib/utils';
import { MediaBox } from './MediaBox';

/** Thumbnail grid sizing presets. */
type MediaGridSize =
  /** Fixed ~150px thumbnails - used for compact lists like watched images. */
  | 'small'
  /** ~150px thumbnails that grow to ~225px on wide viewports (Philomena's main list). */
  | 'large';

/**
 * The `view-transition-name` shared by the home page's grid and the search
 * page's, so paging from one to the other morphs the panel rather than cutting.
 * At most one element per page may carry it - two cancel the transition.
 */
export const SEARCH_RESULTS_TRANSITION = 'search-results';

/**
 * Who owns the page number. Omitted, the grid keeps its own and pages in place,
 * which is what a side block or a settings specimen wants; given, the caller
 * owns it and the grid only reports clicks.
 */
interface MediaGridPaging {
  page: number;
  onPageChange: (page: number) => void;
  /**
   * Whether the pagination carries the steps that go back. A grid pinned to its
   * own first page has nothing behind it.
   */
  back?: boolean;
}

interface MediaGridProps {
  /** Human-readable label, rendered as the panel's title. */
  label: string;
  images: Array<Media>;
  /** How many images the backing query matches in total, across all pages. */
  total: number;
  /** Optional icon rendered before the label. */
  icon?: ReactNode;
  /** Heading level, so the page keeps a single logical `h1`. */
  headingLevel?: 1 | 2;
  /** Thumbnail grid sizing preset. */
  size?: MediaGridSize;
  paging?: MediaGridPaging;
  /** Set to {@link SEARCH_RESULTS_TRANSITION} on the grid that morphs across a
   *  search navigation. */
  viewTransitionName?: string;
  /** The panel element, for callers that scroll the reader back up to it. */
  ref?: Ref<HTMLElement>;
}

/**
 * The grid's own settings, in its title bar rather than in the site-wide
 * display menu: they change this component and nothing else.
 *
 * The same controls the grid's card on the display settings page carries -
 * the link at the bottom goes to that card, for the rest of the page's worth of
 * context around them.
 */
function MediaGridSettings() {
  return (
    <Dropdown
      align="end"
      className="media-grid__settings"
      trigger={
        <Button variant="ghost" icon title="Grid settings" aria-label="Grid settings">
          <MonitorCog size={16} />
        </Button>
      }
    >
      <div className="menu media-grid__settings-menu">
        <ComponentSettingsControls controls={MEDIA_GRID_SETTING_CONTROLS} />

        <hr className="menu-separator" />

        <Link to="/settings/display" hash="media-grid" className="media-grid__settings-link">
          <SlidersHorizontal size={16} />
          More settings
        </Link>
      </div>
    </Dropdown>
  );
}

/**
 * An image gallery: a panel title bar, a responsive thumbnail grid, and a
 * footer with pagination and the result count. Mirrors Philomena's image
 * `index`.
 */
export function MediaGrid({
  label,
  images,
  total,
  icon,
  headingLevel = 2,
  size = 'large',
  paging,
  viewTransitionName,
  ref,
}: MediaGridProps) {
  const [ownPage, setOwnPage] = useState(1);
  const { mediaPerPage } = useComponentSettings();

  const requestedPage = paging?.page ?? ownPage;
  const setPage = paging?.onPageChange ?? setOwnPage;

  // Fabricated in this mockup: the API does not report a page count yet, so it
  // is inferred from the total and the page size the reader asked for.
  const pageCount = Math.max(1, Math.ceil(total / mediaPerPage));
  // Raising the page size shrinks the page count under a reader who is deep in
  // the results, so the stored page is clamped rather than trusted.
  const page = Math.min(requestedPage, pageCount);
  const shown = images.slice(0, mediaPerPage);

  // The heading is visually redundant with the title bar, but the page still
  // needs one logical heading per section for the document outline.
  const Heading = `h${headingLevel}` as const;

  return (
    // Focusable, but not tabbable: a navigation that replaces the grid has
    // nowhere to put focus otherwise, and drops it to the document.
    <Panel ref={ref} tabIndex={-1} className="media-grid-panel" style={{ viewTransitionName }}>
      <Heading className="visually-hidden">{label}</Heading>

      <PanelHeader className="media-grid__title">
        {icon}
        {label}
        <MediaGridSettings />
      </PanelHeader>

      <div className={cn('media-grid', `media-grid--${size}`)}>
        {shown.map(image => (
          <MediaBox key={image.id} image={image} />
        ))}

        {/* Soaks up the justified layout's last-row slack; see `MediaGrid.css`. */}
        <span className="media-grid__filler" />
      </div>

      {/* A single page has nowhere to page to, and a count that only repeats
       * what is on screen. */}
      {pageCount > 1 ? (
        <footer className="media-grid__footer">
          <Pagination label={label} page={page} pageCount={pageCount} onPageChange={setPage} back={paging?.back} />
          <span className="media-grid__count">
            Showing{' '}
            <strong>
              1&ndash;
              {shown.length}
            </strong>{' '}
            of{' '}
            <strong>
              <Int value={total} />
            </strong>{' '}
            total
          </span>
        </footer>
      ) : null}
    </Panel>
  );
}
