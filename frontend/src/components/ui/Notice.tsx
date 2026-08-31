import type { ComponentProps } from 'react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

export type NoticeVariant = 'default' | 'success' | 'warning' | 'danger';

type Props<TElement extends keyof React.JSX.IntrinsicElements> = Omit<ComponentProps<TElement>, 'className'> & {
  className?: ClassValue;
};

/** An inline message attached to the thing it is about. */
export function Notice({ variant = 'default', className, ...props }: Props<'div'> & { variant?: NoticeVariant }) {
  return <div className={cn('notice', variant !== 'default' && `notice--${variant}`, className)} {...props} />;
}

export function NoticeTitle({ className, ...props }: Props<'strong'>) {
  return <strong className={cn('notice-title', className)} {...props} />;
}

/** The site-wide announcement strip. Not a `Notice`: it is centered, untinted
 *  and speaks for the site rather than for anything on the page. */
export function SiteNotice({ className, ...props }: Props<'div'>) {
  return <div className={cn('site-notice', className)} {...props} />;
}
