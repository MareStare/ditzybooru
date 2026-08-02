import type { ComponentProps } from 'react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

/** Fill colors. Each maps to a single `--btn-seed` in `Button.css`. */
export type ButtonVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ComponentProps<'button'>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square, label-less button sized for a single icon. */
  icon?: boolean;
  /** Stretches to the full inline size of the container. */
  block?: boolean;
  className?: ClassValue;
}

export function Button({
  variant = 'default',
  size = 'md',
  icon = false,
  block = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      // Defaulted to `button` above, so a button inside a form never submits it
      // by accident; `submit` is opt-in.
      type={type}
      className={cn(
        'btn',
        variant !== 'default' && `btn--${variant}`,
        size !== 'md' && `btn--${size}`,
        icon && 'btn--icon',
        block && 'btn--block',
        className,
      )}
      {...props}
    />
  );
}

/** A row of buttons welded into one control, e.g. a sort switcher. */
export function ButtonGroup({
  className,
  ...props
}: Omit<ComponentProps<'span'>, 'className'> & { className?: ClassValue }) {
  return <span className={cn('btn-group', className)} {...props} />;
}
