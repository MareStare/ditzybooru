import { createFileRoute, Link } from '@tanstack/react-router';

import { Pagination } from '#/components/ui/Pagination';
import { Panel, PanelBody, PanelHeader } from '#/components/ui/Panel';
import { QueryState } from '#/components/ui/QueryState';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { galleriesQuery } from '#/lib/api/queries';
import { pageSearch } from '#/lib/page-search';

/** The site puts this many galleries on a page. */
const GALLERIES_PER_PAGE = 24;

export const Route = createFileRoute('/galleries/')({
  component: GalleriesPage,
  validateSearch: pageSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => prefetchLive(context, galleriesQuery(deps.page ?? 1, GALLERIES_PER_PAGE)),
});

/** `/galleries`: every gallery, newest first. */
function GalleriesPage() {
  const { page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { kind, data, error, isPending, refetch } = useLiveQuery(galleriesQuery(page, GALLERIES_PER_PAGE));

  return (
    <div className="content-page">
      <h1 className="content-page__title">Galleries</h1>
      <QueryState
        kind={kind}
        data={data}
        error={error}
        isPending={isPending}
        refetch={refetch}
        what="list of galleries"
      >
        {list => (
          <>
            {list.items.map(gallery => (
              <Panel key={gallery.id}>
                <PanelHeader>
                  <Link to="/galleries/$id" params={{ id: gallery.id }} search={{ page: 1 }}>
                    {gallery.title}
                  </Link>
                </PanelHeader>
                <PanelBody>
                  <p className="content-page__meta">by {gallery.user}</p>
                  {gallery.description === '' ? null : <p>{gallery.description}</p>}
                </PanelBody>
              </Panel>
            ))}
            {list.total > GALLERIES_PER_PAGE ? (
              <Pagination
                label="Galleries"
                page={page}
                pageCount={Math.ceil(list.total / GALLERIES_PER_PAGE)}
                onPageChange={nextPage => {
                  void navigate({ search: { page: nextPage } });
                }}
              />
            ) : null}
          </>
        )}
      </QueryState>
    </div>
  );
}
