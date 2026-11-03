import { createFileRoute } from '@tanstack/react-router';

import { Prose } from '#/components/ui/Prose';
import { QueryState } from '#/components/ui/QueryState';
import { RelativeTime } from '#/components/ui/RelativeTime';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { staticPageQuery } from '#/lib/api/queries';

export const Route = createFileRoute('/pages/$slug')({
  component: StaticPage,
  loader: ({ context, params }) => prefetchLive(context, staticPageQuery(params.slug)),
});

/** A page of the site's own: the privacy policy, the FAQ. The same path as on Philomena. */
function StaticPage() {
  const { slug } = Route.useParams();
  const { kind, data, error, isPending, refetch } = useLiveQuery(staticPageQuery(slug));

  return (
    <div className="content-page">
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="page">
        {page => (
          <>
            <h1 className="content-page__title">{page.title}</h1>
            <p className="content-page__meta">
              Last updated <RelativeTime dateTime={page.updatedAt} />
            </p>
            <Prose html={page.bodyHtml} />
          </>
        )}
      </QueryState>
    </div>
  );
}
