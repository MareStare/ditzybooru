import { Link } from '@tanstack/react-router';
import { EyeOff, Film } from 'lucide-react';

import type { Media } from '#/lib/types';
import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

interface MediaThumbProps {
  image: Media;
  /** Which representation to render. */
  src: string;
  /** Alt/title text (Philomena uses a "Size / Tagged: …" summary). */
  title: string;
  /** Whether the user has hidden the image via the interaction bar. */
  hidden?: boolean;
  className?: ClassValue;
}

/**
 * The clickable thumbnail area of a media box: the image itself plus the
 * spoiler / hidden / video overlays Philomena renders on top of it.
 */
export function MediaThumb({ image, src, title, hidden = false, className }: MediaThumbProps) {
  const isVideo = image.mimeType === 'video/webm';
  const spoilered = image.spoilered && !hidden;

  return (
    <Link
      // @ts-expect-error TODO: route not built yet
      to={`/images/${image.id}`}
      title={title}
      className={cn('media-thumb', className)}
    >
      {hidden || spoilered ? (
        <div className={cn('media-overlay', spoilered && 'media-overlay--spoilered')}>
          <EyeOff size={20} />
          <span>{hidden ? 'Hidden' : 'Spoilered'}</span>
        </div>
      ) : null}

      <img
        src={src}
        alt={title}
        loading="lazy"
        className={cn('media-thumb__image', spoilered && 'media-thumb__image--spoilered')}
      />

      {isVideo && !spoilered && !hidden ? (
        <span className="media-thumb__format">
          <Film size={12} />
          WebM
        </span>
      ) : null}
    </Link>
  );
}

export function imageTitle(image: Media): string {
  return `Size: ${image.width}x${image.height} | Tagged: ${image.tags.join(', ')}`;
}
