export type ClassValue = string | false | null | undefined;

/**
 * Joins class names, dropping the falsy ones.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
