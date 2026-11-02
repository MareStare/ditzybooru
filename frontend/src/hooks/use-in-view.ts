import { useCallback, useState } from 'react';

/** How far outside the viewport counts as "about to be seen". */
const ROOT_MARGIN = '200px';

/**
 * Whether an element has come near the viewport, for loading things only a
 * visitor who can see them needs. One-shot: once `true` it stays `true`, so
 * scrolling away never discards what was loaded. `false` on the server and
 * during hydration.
 *
 * Returns a callback ref to put on the element, and the flag.
 */
export function useInView(): [(element: Element | null) => void, boolean] {
  const [inView, setInView] = useState(false);

  const ref = useCallback((element: Element | null) => {
    if (element === null) {
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, inView];
}
