import { footerColumns } from '#/lib/mock/site';
import { cn } from '#/lib/utils';

/** The site footer: resource/help/community link columns and serving info. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__columns">
        {footerColumns.map(column => (
          <div key={column.title}>
            {/* `h2`, not `h5`: the footer's columns are top-level sections of
                the page, and skipping straight to h5 breaks the outline. */}
            <h2 className="site-footer__title">{column.title}</h2>
            <ul className="site-footer__list">
              {column.links.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noreferrer' : undefined}
                    className={cn('site-footer__link', link.bold && 'site-footer__link--bold')}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="site-footer__note">
        A modern frontend for{' '}
        <a href="https://github.com/philomena-dev/philomena" target="_blank" rel="noreferrer">
          philomena
        </a>
        . Rendered with mock data.
      </p>
    </footer>
  );
}
