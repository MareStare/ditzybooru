import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '#/components/ui/Button';
import { Int, formatInt } from '#/components/ui/Int';
import { cn } from '#/lib/utils';

import type { CSSProperties, KeyboardEvent, MouseEvent, SyntheticEvent } from 'react';
import type { ClassValue } from '#/lib/utils';

/** Pages rendered either side of the current one: more than the window shows. */
const RUN = 12;

/** Room the go-to-page panel needs under its trigger before it flips over it. */
const PANEL_ROOM = 80;

interface PaginationProps {
  /** The currently active page, 1-based. */
  page: number;
  pageCount: number;
  /** Called with the requested page when the user picks a different one. */
  onPageChange: (page: number) => void;
  /**
   * What this navigator pages through. Required because a page may carry more
   * than one, and two `<nav>`s both labelled "Pagination" are indistinguishable
   * to anyone navigating by landmark.
   */
  label: string;
  /**
   * Whether the row carries the steps that go back. A grid pinned to its own
   * first page has nothing behind it, and any step forward leaves it anyway.
   */
  back?: boolean;
  className?: ClassValue;
}

/**
 * A page navigator: step controls around a window on the numbered pages.
 *
 * The window is a fixed width and slides its numbers under itself rather than
 * resizing, so the steps either side hold their place while paging and the
 * number that only half fits shows half of itself. The page the reader is on
 * holds the middle of the window until an end of the range comes into it. The ellipsis marking what is
 * held back opens a field to type a page into, which is the way across a range
 * too long to walk. A screen too narrow for a window of numbers keeps the page
 * the reader is on and the steps either side of it, and nothing else.
 *
 * Purely presentational - it reports changes via
 * {@link PaginationProps.onPageChange} so each caller keeps its own page state.
 */
export function Pagination({ page, pageCount, onPageChange, label, back = true, className }: PaginationProps) {
  const navRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const restoreRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  // Where the panel hangs from: the middle of whichever control opened it, in
  // the row's own coordinates, and which side of that control it opens on.
  const [anchor, setAnchor] = useState({ x: 0, above: false });
  const [more, setMore] = useState({ start: false, end: false });
  const [, remeasure] = useReducer((count: number) => count + 1, 0);

  const first = Math.max(1, page - RUN);
  const run = Array.from({ length: Math.min(pageCount, page + RUN) - first + 1 }, (_, i) => first + i);

  // The run slides under the window so the page the reader is on holds the
  // middle of it, and gives that up only where the run runs out. Offset rather
  // than `scrollLeft`: the router restores the scroll position it last saw on
  // every navigation, which is the position of the page before this one.
  // Runs every render on purpose: it measures what the render laid out. The
  // `setMore` bail-out below is what keeps that from looping.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const pages = pagesRef.current;
    const current = currentRef.current;

    if (!strip || !pages || !current) {
      return;
    }

    // Measured against the run's own box, which carries the same offset as the
    // number in it, so what comes out is where the number sits in the run.
    const runBox = pages.getBoundingClientRect();
    const currentBox = current.getBoundingClientRect();
    const room = runBox.width - strip.clientWidth;
    const wanted = currentBox.left - runBox.left + currentBox.width / 2 - strip.clientWidth / 2;
    const offset = Math.max(0, Math.min(wanted, room));

    pages.style.transform = `translateX(${-offset}px)`;

    const view = strip.getBoundingClientRect();

    // A number the window cuts off entirely is scenery, and nothing a pointer or
    // a screen reader should find. Focus on the way out goes to the current
    // page rather than dropping to the document.
    for (const slot of strip.querySelectorAll<HTMLElement>('.page-link')) {
      const slotBox = slot.getBoundingClientRect();
      const clipped = slotBox.right <= view.left || slotBox.left >= view.right;

      if (clipped && slot === document.activeElement) {
        current.focus();
      }

      slot.toggleAttribute('inert', clipped);
    }

    const ends = { start: offset > 1, end: offset < room - 1 };

    setMore(prev => (prev.start === ends.start && prev.end === ends.end ? prev : ends));

    if (restoreRef.current) {
      restoreRef.current = false;
      triggerRef.current?.focus();
    }
  });

  // How wide the window is answers to the font and to the viewport, and neither
  // of those goes through a render of its own.
  useLayoutEffect(() => {
    const observer = new ResizeObserver(remeasure);

    if (navRef.current) {
      observer.observe(navRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // A press anywhere else is the reader done with the panel. Pointer-down rather
  // than click, so it closes on the way to whatever they are reaching for.
  useEffect(() => {
    if (!open) {
      return;
    }

    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && navRef.current?.contains(event.target) !== true) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', dismiss);

    return () => {
      document.removeEventListener('pointerdown', dismiss);
    };
  }, [open]);

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const trigger = event.currentTarget;
    const row = navRef.current?.getBoundingClientRect();
    const box = trigger.getBoundingClientRect();

    triggerRef.current = trigger;
    setAnchor({
      x: row ? box.left + box.width / 2 - row.left : 0,
      above: window.innerHeight - box.bottom < PANEL_ROOM,
    });
    setOpen(!open);
  }

  function close() {
    restoreRef.current = true;
    setDraft('');
    setOpen(false);
  }

  function commit() {
    const next = Number.parseInt(draft, 10);

    close();

    if (Number.isFinite(next)) {
      onPageChange(Math.min(Math.max(next, 1), pageCount));
    }
  }

  /* One of first, prev, next, last. Both halves of the label, because the word
   * is a lot of row on a narrow screen and the chevron carries the step on its
   * own there. */
  function stepButton(target: number, name: string, says: string, chevron: string) {
    const disabled = target === page;

    return (
      <button
        type="button"
        className="page-link"
        aria-label={says}
        disabled={disabled}
        onClick={() => {
          onPageChange(target);
        }}
      >
        {chevron === '«' || chevron === '‹' ? (
          <>
            {chevron}
            <span className="page-word">{name}</span>
          </>
        ) : (
          <>
            <span className="page-word">{name}</span>
            {chevron}
          </>
        )}
      </button>
    );
  }

  /* The pages the window is holding back, and the way to any of them. Comes out
   * of the window's own width, so the row around it never moves. */
  function gap() {
    return (
      <button
        type="button"
        className="page-gap"
        aria-expanded={open}
        aria-label={`Page ${page} of ${pageCount}, go to another page`}
        onClick={toggle}
      >
        …
      </button>
    );
  }

  return (
    <nav
      ref={navRef}
      className={cn('pagination', className)}
      // The window is sized for the widest page number in the range, so that it
      // is never too narrow to show the one the reader is on. Its separators
      // count as a digit each, which is a hair over what they take.
      style={{ '--page-chars': formatInt(pageCount).length } as CSSProperties}
      aria-label={`${label} pages`}
      onKeyDown={(event: KeyboardEvent) => {
        if (open && event.key === 'Escape') {
          close();
        }
      }}
    >
      {back ? (
        <>
          {stepButton(1, 'First', 'First page', '«')}
          {stepButton(Math.max(page - 1, 1), 'Prev', 'Previous page', '‹')}
        </>
      ) : null}

      {/* All the window is worth on a screen with no room for one. */}
      <button
        type="button"
        className="page-link page-link--current page-link--compact"
        aria-current="page"
        aria-expanded={open}
        aria-label={`Page ${page} of ${pageCount}, go to another page`}
        onClick={toggle}
      >
        <Int value={page} />
        <ChevronDown className="page-link__caret" size={12} aria-hidden />
      </button>

      <div className="pagination__window">
        {more.start ? gap() : null}

        <div
          ref={stripRef}
          className={cn(
            'pagination__strip',
            more.start && 'pagination__strip--cut-start',
            more.end && 'pagination__strip--cut-end',
          )}
        >
          <div ref={pagesRef} className="pagination__pages">
            {run.map((p, index) =>
              // Keyed by its place in the run rather than by its number, so that
              // paging renumbers the strip where it stands instead of moving the
              // current page's box out from under its own highlight.
              p === page ? (
                // Not a control: it is where the reader already is. Focusable all
                // the same, for the pass below to hand focus back to.
                <span
                  // eslint-disable-next-line @eslint-react/no-array-index-key -- see above
                  key={index}
                  ref={currentRef}
                  className="page-link page-link--current"
                  tabIndex={-1}
                  aria-current="page"
                >
                  <Int value={p} />
                </span>
              ) : (
                <button
                  // eslint-disable-next-line @eslint-react/no-array-index-key -- see above
                  key={index}
                  type="button"
                  className="page-link"
                  aria-label={`Page ${p}`}
                  onClick={() => {
                    onPageChange(p);
                  }}
                >
                  <Int value={p} />
                </button>
              ),
            )}
          </div>
        </div>

        {more.end ? gap() : null}
      </div>

      {stepButton(Math.min(page + 1, pageCount), 'Next', 'Next page', '›')}
      {stepButton(pageCount, 'Last', 'Last page', '»')}

      {open ? (
        <form
          className={cn('menu', 'pagination__jump', anchor.above && 'pagination__jump--above')}
          style={{ '--jump-x': `${anchor.x}px` } as CSSProperties}
          // The field's own bounds are for the spinner and for anyone reading it
          // out; a number past them is clamped here rather than refused.
          noValidate
          onSubmit={(event: SyntheticEvent) => {
            event.preventDefault();
            commit();
          }}
        >
          <input
            ref={inputRef}
            type="number"
            className="pagination__jump-input"
            inputMode="numeric"
            min={1}
            max={pageCount}
            placeholder={`Page number: 1 - ${pageCount}`}
            aria-label={`Go to page, 1 to ${pageCount}`}
            value={draft}
            onChange={event => {
              setDraft(event.target.value);
            }}
          />
          <Button type="submit" size="sm" variant="primary">
            Go
          </Button>
        </form>
      ) : null}
    </nav>
  );
}
