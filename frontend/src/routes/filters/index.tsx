import { createFileRoute, Link } from '@tanstack/react-router';

import { Panel, PanelBody, PanelHeader } from '#/components/ui/Panel';
import { QueryState } from '#/components/ui/QueryState';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { systemFiltersQuery } from '#/lib/api/queries';

export const Route = createFileRoute('/filters/')({
  component: FiltersPage,
  loader: ({ context }) => prefetchLive(context, systemFiltersQuery()),
});

/** `/filters`: the filters the site provides to everyone. */
function FiltersPage() {
  const { kind, data, error, isPending, refetch } = useLiveQuery(systemFiltersQuery());

  return (
    <div className="content-page">
      <h1 className="content-page__title">Filters</h1>
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="list of filters">
        {filters =>
          filters.map(filter => (
            <Panel key={filter.id}>
              <PanelHeader>
                <Link to="/filters/$id" params={{ id: filter.id }}>
                  {filter.name}
                </Link>
              </PanelHeader>
              <PanelBody>
                <p>{filter.description}</p>
                <p className="content-page__meta">Used by {filter.userCount.toLocaleString()} users</p>
              </PanelBody>
            </Panel>
          ))
        }
      </QueryState>
    </div>
  );
}
