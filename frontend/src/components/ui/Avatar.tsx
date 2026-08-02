import { cn } from '#/lib/utils';
import { initials } from '#/lib/format';

import type { ClassValue } from '#/lib/utils';

interface AvatarProps {
  /** Display name, used for the alt text and the initials fallback. */
  name: string;
  src?: null | string;
  size?: 'sm' | 'md';
  className?: ClassValue;
}

export function Avatar({ name, src = null, size = 'md', className }: AvatarProps) {
  return (
    <span className={cn('avatar', size === 'sm' && 'avatar--sm', className)}>
      {src === null ? initials(name) : <img className="avatar__image" src={src} alt={name} />}
    </span>
  );
}
