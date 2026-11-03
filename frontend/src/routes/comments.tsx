import { createFileRoute, Link } from '@tanstack/react-router';

import { CommunityPost } from '#/components/ui/CommunityPost';
import { Pagination } from '#/components/ui/Pagination';
import { QueryState } from '#/components/ui/QueryState';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { commentsQuery } from '#/lib/api/queries';

/** The site puts this many comments on a page. */
const COMMENTS_PER_PAGE = 25;

interface CommentsSearch {
  /** The search, as the sites name it. */
  cq?: string;
  page?: number;
}

export const Route = createFileRoute('/comments')({
  component: CommentsPage,
  validateSearch: (search: Record<string, unknown>): CommentsSearch => {
    const page = Number(search.page);

    return {
      ...(typeof search.cq === 'string' && search.cq !== '' ? { cq: search.cq } : {}),
      ...(Number.isInteger(page) && page > 1 ? { page } : {}),
    };
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    prefetchLive(context, commentsQuery(deps.cq ?? '*', deps.page ?? 1, COMMENTS_PER_PAGE)),
});

/** `/comments`: image comments matching a search, newest first. */
function CommentsPage() {
  const { cq = '*', page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { kind, data, error, isPending, refetch } = useLiveQuery(commentsQuery(cq, page, COMMENTS_PER_PAGE));

  return (
    <div className="content-page">
      <h1 className="content-page__title">Comments</h1>
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="list of comments">
        {list => (
          <>
            {list.items.map(comment => (
              <div key={comment.id}>
                <p className="content-page__meta">
                  <Link to="/images/$id" params={{ id: comment.imageId }} hash={`comment_${comment.id}`}>
                    Image #{comment.imageId}
                  </Link>
                </p>
                <CommunityPost post={comment} idPrefix="comment_" />
              </div>
            ))}
            {list.total > COMMENTS_PER_PAGE ? (
              <Pagination
                label="Comments"
                page={page}
                pageCount={Math.ceil(list.total / COMMENTS_PER_PAGE)}
                onPageChange={nextPage => {
                  void navigate({ search: { ...(cq === '*' ? {} : { cq }), page: nextPage } });
                }}
              />
            ) : null}
          </>
        )}
      </QueryState>
    </div>
  );
}
