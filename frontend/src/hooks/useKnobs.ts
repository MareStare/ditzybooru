import { useSyncExternalStore } from 'react';

import { DEFAULT_KNOBS, getKnobs, subscribeKnobs } from '#/lib/knobs';
import type { Knobs } from '#/lib/knobs';

/**
 * The current appearance knobs, kept in step across every component showing
 * them. Writes go through `setKnob`/`resetKnobs` in `lib/knobs`.
 */
export function useKnobs(): Knobs {
  // The server snapshot is the shipped default: there is no localStorage to
  // read during SSR, and the pre-paint script has not run yet either.
  return useSyncExternalStore(subscribeKnobs, getKnobs, () => DEFAULT_KNOBS);
}
