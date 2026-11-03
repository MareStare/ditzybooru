import { createFileRoute } from '@tanstack/react-router';

import { Badge } from '#/components/ui/Badge';
import { Panel, PanelBody, PanelHeader } from '#/components/ui/Panel';
import { Prose } from '#/components/ui/Prose';
import { QueryState } from '#/components/ui/QueryState';
import { RelativeTime } from '#/components/ui/RelativeTime';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { rulesQuery } from '#/lib/api/queries';

export const Route = createFileRoute('/rules')({
  component: Rules,
  loader: ({ context }) => prefetchLive(context, rulesQuery()),
});

function Rules() {
  const { kind, data, error, isPending, refetch } = useLiveQuery(rulesQuery());

  return (
    <div className="content-page">
      <h1 className="content-page__title">Site Rules</h1>
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="page">
        {rules => (
          <>
            <p className="content-page__meta">
              The rules were last updated <RelativeTime dateTime={rules.updatedAt} />.
            </p>
            {rules.items.map(rule => (
              <Panel key={rule.id} id={String(rule.id)} className="rule">
                <PanelHeader>
                  {rule.title}
                  {rule.important ? <Badge variant="danger">Important</Badge> : null}
                </PanelHeader>
                <PanelBody>
                  <Prose html={rule.bodyHtml} />
                </PanelBody>
                {rule.examplesHtml === null ? null : (
                  <details className="rule__examples">
                    <summary>View examples</summary>
                    <Prose html={rule.examplesHtml} />
                  </details>
                )}
              </Panel>
            ))}
          </>
        )}
      </QueryState>
    </div>
  );
}
