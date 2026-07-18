import { ArrowDown, ArrowUp, EyeOff, MessageSquare, Star } from 'lucide-react';

import type { Image } from '#/lib/types';
import { useImageInteraction } from '#/hooks/useImageInteraction';
import { formatCount } from '#/lib/format';
import { cn } from '#/lib/utils';
import { MediaThumb, imageTitle } from './MediaThumb';

interface InteractionButtonProps {
  onClick: () => void;
  active?: boolean;
  activeClass: string;
  title: string;
  label: string;
  children: React.ReactNode;
}

function InteractionButton({ onClick, active = false, activeClass, title, label, children }: InteractionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        active ? activeClass : null,
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

/**
 * A single image thumbnail with Philomena's interaction bar (fave / upvote /
 * score / downvote / comments / hide). Interactions update the on-screen
 * counters optimistically via {@link useImageInteraction}.
 */
export function MediaBox({ image }: { image: Image }) {
  const interaction = useImageInteraction(image);

  return (
    <div className="media-box group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className="flex h-7 shrink-0 items-center justify-between gap-0.5 border-b bg-card px-1 text-xs tabular-nums">
        <InteractionButton
          onClick={interaction.toggleFave}
          active={interaction.faved}
          activeClass="text-amber-500 hover:text-amber-500"
          title="Fave!"
          label="Faves"
        >
          <Star className={cn('size-3.5', interaction.faved ? 'fill-current' : null)} />
          <span>{formatCount(interaction.faves)}</span>
        </InteractionButton>

        <div className="flex items-center">
          <InteractionButton
            onClick={interaction.toggleUpvote}
            active={interaction.vote === 'up'}
            activeClass="text-green-600 hover:text-green-600 dark:text-green-400"
            title="Yay!"
            label="Upvote"
          >
            <ArrowUp className="size-3.5" />
          </InteractionButton>
          <span
            className={cn(
              'min-w-5 text-center font-medium',
              interaction.score > 0 ? 'text-green-600 dark:text-green-400' : null,
              interaction.score < 0 ? 'text-red-600 dark:text-red-400' : null,
            )}
            title="Score"
          >
            {formatCount(interaction.score)}
          </span>
          <InteractionButton
            onClick={interaction.toggleDownvote}
            active={interaction.vote === 'down'}
            activeClass="text-red-600 hover:text-red-600 dark:text-red-400"
            title="Neigh!"
            label="Downvote"
          >
            <ArrowDown className="size-3.5" />
          </InteractionButton>
        </div>

        <a
          href={`/images/${String(image.id)}#comments`}
          title="Comments"
          className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MessageSquare className="size-3.5" />
          <span>{formatCount(image.commentCount)}</span>
        </a>

        <InteractionButton
          onClick={interaction.toggleHidden}
          active={interaction.hidden}
          activeClass="text-red-600 hover:text-red-600 dark:text-red-400"
          title="Hide"
          label="Hide"
        >
          <EyeOff className="size-3.5" />
        </InteractionButton>
      </div>

      <MediaThumb
        image={image}
        src={image.representations.thumb}
        title={imageTitle(image)}
        hidden={interaction.hidden}
        className="aspect-square"
      />
    </div>
  );
}
