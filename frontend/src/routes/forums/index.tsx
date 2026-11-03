import { createFileRoute, Link } from '@tanstack/react-router';

import { Panel } from '#/components/ui/Panel';
import { QueryState } from '#/components/ui/QueryState';
import { Table, TableScroll } from '#/components/ui/Table';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { forumsQuery } from '#/lib/api/queries';

export const Route = createFileRoute('/forums/')({
  component: Forums,
  loader: ({ context }) => prefetchLive(context, forumsQuery()),
});

/** `/forums`: every forum, as Philomena lists them. */
function Forums() {
  const { kind, data, error, isPending, refetch } = useLiveQuery(forumsQuery());

  return (
    <div className="content-page">
      <h1 className="content-page__title">Discussion Forums</h1>
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="page">
        {forums => (
          <Panel>
            <TableScroll>
              <Table numeric>
                <thead>
                  <tr>
                    <th>Forum</th>
                    <th>Topics</th>
                    <th>Posts</th>
                  </tr>
                </thead>
                <tbody>
                  {forums.map(forum => (
                    <tr key={forum.slug}>
                      <td>
                        <Link to="/forums/$forum" params={{ forum: forum.slug }}>
                          {forum.name}
                        </Link>
                        <div className="content-page__meta">{forum.description}</div>
                      </td>
                      <td>{forum.topicCount}</td>
                      <td>{forum.postCount}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          </Panel>
        )}
      </QueryState>
    </div>
  );
}
