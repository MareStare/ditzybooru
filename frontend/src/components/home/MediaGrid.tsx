import { useState } from 'react';
import type { ReactNode } from 'react';

import type { Media } from '#/lib/types';
import { Int } from '#/components/ui/Int';
import { Pagination } from '#/components/ui/Pagination';
import { Panel, PanelHeader } from '#/components/ui/Panel';
import { cn } from '#/lib/utils';
import { MediaBox } from './MediaBox';

/** Thumbnail grid sizing presets. */
type MediaGridSize =
  /** Fixed ~150px thumbnails — used for compact lists like watched images. */
  | 'small'
  /** ~150px thumbnails that grow to ~225px on wide viewports (Philomena's main list). */
  | 'large';

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
}

/**
 * An image gallery: a panel title bar, a responsive thumbnail grid, and a
 * footer with pagination and the result count. Mirrors Philomena's image
 * `index`.
 */
export function MediaGrid({ label, images, total, icon, headingLevel = 2, size = 'large' }: MediaGridProps) {
  const [page, setPage] = useState(1);

  // Fabricated in this mockup: the API does not report a page count yet, so it
  // is inferred from the total and the size of the page we were handed.
  const pageCount = Math.max(1, Math.ceil(total / Math.max(images.length, 1)));

  // The heading is visually redundant with the title bar, but the page still
  // needs one logical heading per section for the document outline.
  const Heading = `h${headingLevel}` as const;

  return (
    <Panel>
      <Heading className="visually-hidden">{label}</Heading>

      <PanelHeader className="media-grid__title">
        {icon}
        {label}
      </PanelHeader>

      <div className={cn('media-grid', `media-grid--${size}`)}>
        {images.map(image => (
          <MediaBox key={image.id} image={image} />
        ))}
      </div>

      <footer className="media-grid__footer">
        <Pagination label={label} page={page} pageCount={pageCount} onPageChange={setPage} />
        <span className="media-grid__count">
          Showing{' '}
          <strong>
            1&ndash;
            {images.length}
          </strong>{' '}
          of{' '}
          <strong>
            <Int value={total} />
          </strong>{' '}
          total
        </span>
      </footer>
    </Panel>
  );
}
