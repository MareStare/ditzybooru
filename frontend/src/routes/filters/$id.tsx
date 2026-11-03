import { createFileRoute, Link } from '@tanstack/react-router';

import { Panel, PanelBody, PanelHeader } from '#/components/ui/Panel';
import { QueryState } from '#/components/ui/QueryState';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { filterQuery } from '#/lib/api/queries';

export const Route = createFileRoute('/filters/$id')({
  component: FilterPage,
  params: {
    // A bad id is not the router's error: the page says there is no such filter.
    parse: ({ id }: { id: string }) => ({ id: Number(id) }),
    stringify: ({ id }: { id: number }) => ({ id: String(id) }),
  },
  loader: ({ context, params }) => prefetchLive(context, filterQuery(params.id)),
});

function QuerySection({ title, complex, tagCount }: { title: string; complex: null | string; tagCount: number }) {
  if (complex === null && tagCount === 0) {
    return null;
  }

  return (
    <Panel>
      <PanelHeader>{title}</PanelHeader>
      <PanelBody>
        {tagCount === 0 ? null : <p>{tagCount.toLocaleString()} tags</p>}
        {complex === null ? null : <code>{complex}</code>}
      </PanelBody>
    </Panel>
  );
}

/** `/filters/:id`: one filter. */
function FilterPage() {
  const { id } = Route.useParams();
  const { kind, data, error, isPending, refetch } = useLiveQuery(filterQuery(id));

  return (
    <div className="content-page">
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="filter">
        {filter => (
          <>
            <p className="content-page__meta">
              <Link to="/filters">Filters</Link> &raquo; {filter.name}
            </p>
            <h1 className="content-page__title">{filter.name}</h1>
            {filter.description === '' ? null : <p>{filter.description}</p>}
            <p className="content-page__meta">Used by {filter.userCount.toLocaleString()} users</p>
            <QuerySection title="Hidden" complex={filter.hiddenComplex} tagCount={filter.hiddenTagIds.length} />
            <QuerySection
              title="Spoilered"
              complex={filter.spoileredComplex}
              tagCount={filter.spoileredTagIds.length}
            />
          </>
        )}
      </QueryState>
    </div>
  );
}
