import { UndoDot } from 'lucide-react';

import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

interface ResetButtonProps {
  /** The setting this restores, for the accessible name - the icon alone names
   *  nothing, and a row of identical undo buttons names nothing twice. */
  setting: string;
  /** The default, spelled out in the tooltip. That is the question a disabled
   *  reset would otherwise leave unanswered: what would it have put back?
   *  `undefined` while it is not knowable yet - see `DisplaySettings`. */
  defaultLabel: string | undefined;
  /** The default is whatever the OS says, rather than a value the site chose.
   *  Named in the tooltip, because "Dark" alone would read as a value someone
   *  picked rather than as one that follows the machine. */
  fromSystem?: boolean;
  disabled: boolean;
  onReset: () => void;
  className?: ClassValue;
}

/**
 * Puts one setting back to the value the site shipped with.
 *
 * Every setting has one, in the same place and drawn the same way, so "how do I
 * undo this" has a single answer. Disabled rather than hidden while the setting
 * is already at its default: a control that vanishes once you have finished
 * with it is one the reader has to rediscover the next time they change
 * something.
 */
export function ResetButton({ setting, defaultLabel, fromSystem, disabled, onReset, className }: ResetButtonProps) {
  const target = fromSystem === true ? 'OS default' : 'default';
  const title = defaultLabel === undefined ? `Reset to ${target}` : `Reset to ${target}: ${defaultLabel}`;

  return (
    <button
      type="button"
      className={cn('reset-button', className)}
      disabled={disabled}
      title={title}
      aria-label={title.replace('Reset', `Reset ${setting}`)}
      onClick={onReset}
    >
      <UndoDot size={16} aria-hidden="true" />
    </button>
  );
}
