import { EyeOff, Film } from 'lucide-react';

import type { Image } from '#/lib/types';
import { cn } from '#/lib/utils';

interface MediaThumbProps {
  image: Image;
  /** Which representation to render. */
  src: string;
  /** Alt/title text (Philomena uses a "Size / Tagged: …" summary). */
  title: string;
  /** Whether the user has hidden the image via the interaction bar. */
  hidden?: boolean;
  className?: string;
}

/**
 * The clickable thumbnail area of a media box: the image itself plus the
 * spoiler / hidden / video overlays Philomena renders on top of it.
 */
export function MediaThumb({ image, src, title, hidden = false, className }: MediaThumbProps) {
  const isVideo = image.mimeType === 'video/webm';

  return (
    <a
      href={`/images/${String(image.id)}`}
      title={title}
      className={cn('group/thumb relative block overflow-hidden bg-muted', className)}
    >
      {hidden ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
          <EyeOff className="size-5" />
          <span className="text-xs font-medium">Hidden</span>
        </div>
      ) : image.spoilered ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-muted/95 text-muted-foreground">
          <EyeOff className="size-5" />
          <span className="text-xs font-medium">Spoilered</span>
        </div>
      ) : null}

      <img
        src={src}
        alt={title}
        loading="lazy"
        className={cn(
          'absolute inset-0 size-full object-cover transition-transform duration-200 group-hover/thumb:scale-[1.03]',
          image.spoilered && !hidden ? 'blur-lg' : null,
        )}
      />

      {isVideo && !image.spoilered && !hidden ? (
        <span className="absolute top-1 right-1 z-10 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          <Film className="size-3" />
          WebM
        </span>
      ) : null}
    </a>
  );
}

/** Builds the "Size: WxH | Tagged: …" hover text that Philomena uses. */
export function imageTitle(image: Image): string {
  return `Size: ${String(image.width)}x${String(image.height)} | Tagged: ${image.tags.join(', ')}`;
}
