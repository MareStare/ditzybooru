/**
 * Motion read from the cascade rather than from `lib/displaySettings`, because
 * `--motion-scale` is where the "Animations" setting and
 * `prefers-reduced-motion` have already been reconciled.
 */

export function motionScale(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--motion-scale');
  const scale = Number.parseFloat(raw);

  return Number.isFinite(scale) ? scale : 1;
}

export function animationsEnabled(): boolean {
  return motionScale() > 0;
}
