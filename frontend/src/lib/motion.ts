/**
 * Motion read from the cascade rather than from `lib/displaySettings`, because
 * `--motion-scale` is where the "Animations" setting and
 * `prefers-reduced-motion` have already been reconciled.
 */

/**
 * A pagination scroll is near-instant for a short hop and only a little longer
 * for a long one, so crossing a whole grid does not read as a teleport.
 */
const SCROLL_MIN_MS = 80;
const SCROLL_MAX_MS = 100;
const SCROLL_MS_PER_PX = 0.06;

export function motionScale(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--motion-scale');
  const scale = Number.parseFloat(raw);

  return Number.isFinite(scale) ? scale : 1;
}

export function animationsEnabled(): boolean {
  return motionScale() > 0;
}

function easeInOut(progress: number): number {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

/**
 * Scrolls the page until `element` sits at the top of the viewport, clear of
 * whatever its `scroll-margin-block-start` reserves for the sticky header.
 *
 * Hand-animated rather than `scrollIntoView({ behavior: 'smooth' })`: the native
 * duration is a UA constant of several hundred milliseconds, far too slow for a
 * control clicked repeatedly, and it ignores the site's animation setting.
 */
export function scrollToTopOf(element: HTMLElement, { animate }: { animate: boolean }): Promise<void> {
  const margin = Number.parseFloat(getComputedStyle(element).scrollMarginBlockStart) || 0;
  const from = window.scrollY;
  const to = Math.max(0, from + element.getBoundingClientRect().top - margin);
  const distance = Math.abs(to - from);
  const duration = animate ? Math.min(SCROLL_MAX_MS, SCROLL_MIN_MS + distance * SCROLL_MS_PER_PX) * motionScale() : 0;

  if (duration <= 0 || distance === 0) {
    window.scrollTo({ top: to });
    return Promise.resolve();
  }

  return new Promise(resolve => {
    let startedAt: number | undefined;
    const step = (now: number) => {
      startedAt ??= now;
      const progress = Math.min((now - startedAt) / duration, 1);
      window.scrollTo({ top: from + (to - from) * easeInOut(progress) });
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(step);
  });
}
