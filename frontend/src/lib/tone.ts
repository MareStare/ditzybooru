import type { CSSProperties } from 'react';

/**
 * The site's tone names, matching the `--tone-*` seeds in `tokens/semantic.css`.
 *
 * A tone is a hue that says which section of the site you are looking at.
 * Anything that sets `--tone-seed` gets the text and wash variants derived for
 * it, so a caller only ever names the section.
 */
export type Tone = 'forums' | 'comments' | 'tags' | 'galleries' | 'streams' | 'commissions';

/** Points the tone tokens at one hue, for anything that carries a tone. */
export function toneStyle(name: Tone): CSSProperties {
  return { '--tone-seed': `var(--tone-${name})` } as CSSProperties;
}
