import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, EyeOff, FolderPlus, Link2, MessageSquare, MoreHorizontal, Star } from 'lucide-react';

import type { Media } from '#/lib/types';
import { useImageInteraction } from '#/hooks/useImageInteraction';
import { Int } from '#/components/ui/Int';
import { Menu, MenuButton } from '#/components/ui/Menu';
import { cn } from '#/lib/utils';
import { MediaThumb, imageTitle } from './MediaThumb';

import type { ClassValue } from '#/lib/utils';

interface InteractionButtonProps {
  /** BEM modifier picking the action's accent, e.g. `media-action--fave`. */
  modifier?: string;
  onClick: () => void;
  active?: boolean;
  title: string;
  label: string;
  children: React.ReactNode;
}

function InteractionButton({ modifier, onClick, active = false, title, label, children }: InteractionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn('media-action', modifier)}
    >
      {children}
      <span className="visually-hidden">{label}</span>
    </button>
  );
}

/**
 * The card's overflow menu: the actions that are used rarely enough not to earn
 * a permanent slot in a bar this dense.
 *
 * Click-to-open rather than the hover-revealed {@link Dropdown} used in the
 * header — a grid is dozens of these, and sweeping the pointer across it would
 * flick menus open the whole way.
 */
function MediaBoxMenu({
  image,
  hidden,
  onToggleHidden,
  inGallery,
  onToggleGallery,
}: {
  image: Media;
  hidden: boolean;
  onToggleHidden: () => void;
  inGallery: boolean;
  onToggleGallery: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
  };

  return (
    <div className="media-box__more" ref={ref}>
      <button
        type="button"
        className="media-action"
        title="More"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen(prev => !prev);
        }}
      >
        <MoreHorizontal size={14} />
      </button>

      {open ? (
        <Menu className="media-box__menu">
          <MenuButton
            onClick={() => {
              void navigator.clipboard.writeText(new URL(`/images/${image.id}`, location.origin).href);
              close();
            }}
          >
            <Link2 size={14} />
            Copy link
          </MenuButton>
          <MenuButton
            selected={inGallery}
            onClick={() => {
              onToggleGallery();
              close();
            }}
          >
            <FolderPlus size={14} />
            {inGallery ? 'Remove from gallery' : 'Add to gallery'}
          </MenuButton>
          <MenuButton
            selected={hidden}
            onClick={() => {
              onToggleHidden();
              close();
            }}
          >
            <EyeOff size={14} />
            {hidden ? 'Unhide' : 'Hide'}
          </MenuButton>
        </Menu>
      ) : null}
    </div>
  );
}

interface MediaBoxProps {
  className?: ClassValue;
  image: Media;
  /** Which representation to render; defaults to the standard thumb. */
  src?: string;
}

/**
 * A single image thumbnail with Philomena's interaction bar (fave / upvote /
 * score / downvote / comments / more). Interactions update the on-screen
 * counters optimistically via {@link useImageInteraction}.
 */
export function MediaBox({ className, image, src = image.representations.thumb }: MediaBoxProps) {
  const interaction = useImageInteraction(image);

  return (
    <article className={cn('media-box', className)}>
      <div className="media-box-bar">
        <InteractionButton
          modifier="media-action--fave"
          onClick={interaction.toggleFave}
          active={interaction.faved}
          title="Fave!"
          label="Faves"
        >
          {/* Not showing the fave count, to keep the bar from crowding. */}
          <Star size={14} fill={interaction.faved ? 'currentColor' : 'none'} />
        </InteractionButton>

        <span className="media-box__votes">
          <InteractionButton
            modifier="media-action--up"
            onClick={interaction.toggleUpvote}
            active={interaction.vote === 'up'}
            title="Yay!"
            label="Upvote"
          >
            <ArrowUp size={14} strokeWidth={interaction.vote === 'up' ? 2.75 : 2} />
          </InteractionButton>
          {/* Deliberately not `<Int>`: the thousands separator buys nothing on a
              3-4 digit score and its extra glyph is real width in a bar this
              tight. */}
          <span className="media-score" title="Score">
            {interaction.score}
          </span>
          <InteractionButton
            modifier="media-action--down"
            onClick={interaction.toggleDownvote}
            active={interaction.vote === 'down'}
            title="Neigh!"
            label="Downvote"
          >
            <ArrowDown size={14} strokeWidth={interaction.vote === 'down' ? 2.75 : 2} />
          </InteractionButton>
        </span>

        <a href={`/images/${image.id}#comments`} title="Comments" className="media-action">
          <MessageSquare size={14} />
          <Int className="media-action__count" value={image.commentCount} />
        </a>

        <MediaBoxMenu
          image={image}
          hidden={interaction.hidden}
          onToggleHidden={interaction.toggleHidden}
          inGallery={interaction.inGallery}
          onToggleGallery={interaction.toggleGallery}
        />
      </div>

      <MediaThumb image={image} src={src} title={imageTitle(image)} hidden={interaction.hidden} />
    </article>
  );
}
