import type { ComponentProps, ReactNode } from 'react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

type Props<TElement extends keyof React.JSX.IntrinsicElements> = Omit<ComponentProps<TElement>, 'className'> & {
  className?: ClassValue;
};

/**
 * Form controls.
 *
 * Native elements styled as ordinary boxes rather than re-created, so keyboard
 * handling, IME, autofill and assistive-tech semantics stay intact.
 */
export function Field({ className, ...props }: Props<'input'>) {
  return <input className={cn('field', className)} {...props} />;
}

export function Textarea({ className, ...props }: Props<'textarea'>) {
  return <textarea className={cn('field', className)} {...props} />;
}

export function FieldGroup({ className, ...props }: Props<'div'>) {
  return <div className={cn('field-group', className)} {...props} />;
}

/** Labels the control named by `htmlFor`, or captions a group when given none. */
export function FieldLabel({ htmlFor, className, children }: { htmlFor?: string } & Props<'span'>) {
  if (htmlFor === undefined) {
    return <span className={cn('field-label', className)}>{children}</span>;
  }

  return (
    <label htmlFor={htmlFor} className={cn('field-label', className)}>
      {children}
    </label>
  );
}

export function FieldHint({ className, ...props }: Props<'span'>) {
  return <span className={cn('field-hint', className)} {...props} />;
}

interface ChoiceProps extends Omit<ComponentProps<'input'>, 'className' | 'children'> {
  className?: ClassValue;
  children: ReactNode;
}

/**
 * The label text is its own element rather than a bare text node, so the checked
 * state is reachable from the input's own state through a sibling selector. The
 * alternative is `:has()` on the label, which costs eight Firefox versions off
 * the browser floor - see `cssTargets` in `vite.config.ts`.
 */
function ChoiceRoot({ inputClassName, children, className, ...input }: ChoiceProps & { inputClassName?: string }) {
  return (
    <label className={cn('choice', input.disabled === true && 'choice--disabled', className)}>
      <input className={inputClassName} {...input} />
      <span className="choice__label">{children}</span>
    </label>
  );
}

/** A checkbox or radio - pass `type="radio"` for the latter - with its label. */
export function Choice(props: ChoiceProps) {
  return <ChoiceRoot type="checkbox" {...props} />;
}

/** A checkbox drawn as a sliding switch. */
export function Switch(props: ChoiceProps) {
  return <ChoiceRoot type="checkbox" role="switch" inputClassName="switch" {...props} />;
}
