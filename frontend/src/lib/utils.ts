/**
 * A class value that survives being written inline in JSX: strings, and the
 * `false`/`null`/`undefined` a `&&` or a ternary produces when a modifier does
 * not apply.
 */
export type ClassValue = string | false | null | undefined;

/**
 * Joins class names, dropping the falsy ones.
 *
 * Deliberately dumber than the Tailwind-era `cn()` it replaces: BEM class names
 * do not conflict with each other, so there is nothing to de-duplicate — the
 * last-wins merging `tailwind-merge` performed only existed because utility
 * classes collide.
 */
export function cn(...values: Array<ClassValue>): string {
  return values.filter(Boolean).join(' ');
}
