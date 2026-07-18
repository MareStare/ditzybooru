import { footerColumns } from '#/lib/mock/site';

/** The site footer: resource/help/community link columns and serving info. */
export function SiteFooter() {
  return (
    <footer className="mt-8 border-t bg-card/40">
      <div className="px-4 py-8">
        <div className="mx-auto grid w-fit grid-cols-2 gap-8 sm:grid-cols-3">
          {footerColumns.map(column => (
            <div key={column.title}>
              <h5 className="mb-2 text-sm font-semibold">{column.title}</h5>
              <ul className="space-y-1">
                {column.links.map(link => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noreferrer' : undefined}
                      className={
                        'text-sm text-muted-foreground transition-colors hover:text-foreground' +
                        (link.bold ? ' font-medium text-foreground/80' : '')
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          A modern frontend for{' '}
          <a
            href="https://github.com/philomena-dev/philomena"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            philomena
          </a>
          . Rendered with mock data.
        </p>
      </div>
    </footer>
  );
}
