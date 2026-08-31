import type { ComponentProps } from 'react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

type Props<TElement extends keyof React.JSX.IntrinsicElements> = Omit<ComponentProps<TElement>, 'className'> & {
  className?: ClassValue;
};

/** A zebra-striped data table. `numeric` right-aligns every column but the first
 *  and puts it on tabular figures. */
export function Table({ numeric = false, className, ...props }: Props<'table'> & { numeric?: boolean }) {
  return <table className={cn('table', numeric && 'table--numeric', className)} {...props} />;
}

/** Wrap a wide table in this: it must scroll inside its own box, never widen
 *  the page. */
export function TableScroll({ className, ...props }: Props<'div'>) {
  return <div className={cn('table-scroll', className)} {...props} />;
}
