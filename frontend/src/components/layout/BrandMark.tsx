import { useSite } from '#/hooks/use-site';

/**
 * The site's logo, or its first letter when it has none.
 *
 * Decorative either way: the link or heading next to it carries the name, and
 * the letter is drawn by CSS so the visible text stays the name alone.
 */
export function BrandMark() {
  const site = useSite();

  if (site.logo !== null) {
    return <img className="nav-brand__mark nav-brand__mark--logo" src={site.logo} alt="" width={32} height={32} />;
  }

  return <span className="nav-brand__mark" aria-hidden="true" data-initial={site.name.charAt(0).toUpperCase()} />;
}
