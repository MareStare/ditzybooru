import { createFileRoute } from '@tanstack/react-router';

import { Avatar } from '#/components/ui/Avatar';
import { Panel } from '#/components/ui/Panel';
import { QueryState } from '#/components/ui/QueryState';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { staffQuery } from '#/lib/api/queries';

export const Route = createFileRoute('/staff')({
  component: Staff,
  loader: ({ context }) => prefetchLive(context, staffQuery()),
});

function Staff() {
  const { kind, data, error, isPending, refetch } = useLiveQuery(staffQuery());

  return (
    <div className="content-page">
      <h1 className="content-page__title">Staff</h1>
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="page">
        {groups =>
          groups.map(group => (
            <section key={group.name} className="staff-group">
              <h2 className="staff-group__title">{group.name}</h2>
              <p className="content-page__meta">{group.description}</p>
              <div className="staff-group__grid">
                {group.members.map(member => (
                  <Panel key={member.name} className="staff-member">
                    <Avatar name={member.name} src={member.avatarUrl} />
                    <strong>{member.name}</strong>
                    <p className="staff-member__description">{member.description}</p>
                  </Panel>
                ))}
              </div>
            </section>
          ))
        }
      </QueryState>
    </div>
  );
}
