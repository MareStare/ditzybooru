import type { ComponentProps } from 'react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

/** Derpibooru's tag namespaces. Untyped tags carry no category. */
export type TagCategory =
  | 'rating'
  | 'spoiler'
  | 'origin'
  | 'oc'
  | 'error'
  | 'character'
  | 'content-official'
  | 'content-fanmade'
  | 'species'
  | 'body-type';

interface TagProps extends Omit<ComponentProps<'a'>, 'className'> {
  category?: TagCategory;
  className?: ClassValue;
}

/** A tag chip. See `Tag.css` for how a category colors it. */
export function Tag({ category, className, ...props }: TagProps) {
  return <a className={cn('tag', category !== undefined && `tag--${category}`, className)} {...props} />;
}

/** The count riding along inside a tag. */
export function TagCount({
  className,
  ...props
}: Omit<ComponentProps<'span'>, 'className'> & { className?: ClassValue }) {
  return <span className={cn('tag-count', className)} {...props} />;
}

export function TagList({ className, ...props }: Omit<ComponentProps<'ul'>, 'className'> & { className?: ClassValue }) {
  return <ul className={cn('tag-list', className)} {...props} />;
}
