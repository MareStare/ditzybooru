import { ArrowDown, ArrowUp, EyeOff, MessageSquare, Star } from 'lucide-react';
import type { ClassValue } from 'clsx';
import type { Media } from '#/lib/types';
import { useImageInteraction } from '#/hooks/useImageInteraction';
import { Int } from '#/components/ui/int';
import { cn } from '#/lib/utils';
import { MediaThumb, imageTitle } from './MediaThumb';

interface InteractionButtonProps {
  activeClass: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
  title: string;
  label: string;
  children: React.ReactNode;
}

function InteractionButton({
  className,
  onClick,
  active = false,
  activeClass,
  title,
  label,
  children,
}: InteractionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        'inline-flex h-full items-center py-1.5 gap-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        active ? activeClass : null,
        className,
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
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
 * score / downvote / comments / hide). Interactions update the on-screen
 * counters optimistically via {@link useImageInteraction}.
 */
export function MediaBox({ className, image, src = image.representations.thumb }: MediaBoxProps) {
  const interaction = useImageInteraction(image);

  return (
    <div
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex h-7 shrink-0 items-center justify-center gap-0.5 border-b bg-muted px-1 text-xs tabular-nums">
        <InteractionButton
          onClick={interaction.toggleFave}
          active={interaction.faved}
          activeClass="bg-amber-500/25 text-amber-500 hover:bg-amber-500/25 hover:text-amber-500"
          title="Fave!"
          label="Faves"
        >
          <Star className={cn('size-3.5', interaction.faved ? 'fill-current' : null)} />
          {/*
          Not showing faves count to reduce UI clutter.
          <Int value={interaction.faves} />
          */}
        </InteractionButton>

        <div className="flex items-center">
          <InteractionButton
            onClick={interaction.toggleUpvote}
            className="hover:text-green-600"
            active={interaction.vote === 'up'}
            activeClass="bg-green-600/25 text-green-600 dark:text-green-400 hover:bg-green-600/25 dark:bg-green-400/25 dark:hover:bg-green-400/25"
            title="Yay!"
            label="Upvote"
          >
            <ArrowUp className="size-3.5" strokeWidth={interaction.vote === 'up' ? 2.75 : 2} />
          </InteractionButton>
          <span
            className={cn(
              'text-center font-medium',
              interaction.score > 0 ? 'text-green-600 dark:text-green-400' : null,
              interaction.score < 0 ? 'text-red-600 dark:text-red-400' : null,
            )}
            title="Score"
          >
            <Int value={interaction.score} />
          </span>
          <InteractionButton
            onClick={interaction.toggleDownvote}
            className="hover:text-red-600 dark:hover:text-red-400"
            active={interaction.vote === 'down'}
            activeClass="text-red-600 dark:text-red-400 bg-red-600/25 hover:bg-red-600/25 dark:bg-red-400/25 dark:hover:bg-red-400/25"
            title="Neigh!"
            label="Downvote"
          >
            <ArrowDown className="size-3.5" strokeWidth={interaction.vote === 'down' ? 2.75 : 2} />
          </InteractionButton>
        </div>

        <a
          href={`/images/${image.id}#comments`}
          title="Comments"
          className="py-1.5 inline-flex h-full items-center gap-0.5 rounded px-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MessageSquare class="size-3.5" />
          <span>
            <Int value={image.commentCount} />
          </span>
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
        src={src}
        title={imageTitle(image)}
        hidden={interaction.hidden}
        className="aspect-square"
      />
    </div>
  );
}
