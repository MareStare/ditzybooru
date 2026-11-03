import { createFileRoute, Link } from '@tanstack/react-router';

import { Avatar } from '#/components/ui/Avatar';
import { Pagination } from '#/components/ui/Pagination';
import { Panel } from '#/components/ui/Panel';
import { Prose } from '#/components/ui/Prose';
import { QueryState } from '#/components/ui/QueryState';
import { RelativeTime } from '#/components/ui/RelativeTime';
import { useLiveQuery } from '#/hooks/use-live-query';
import { POSTS_PER_PAGE } from '#/lib/api/backend/content';
import type { TopicPost } from '#/lib/api/backend/content';
import { prefetchLive } from '#/lib/api/prefetch';
import { topicPageQuery } from '#/lib/api/queries';
import { pageSearch } from '#/lib/page-search';

export const Route = createFileRoute('/forums/$forum/topics/$topic')({
  component: TopicPage,
  validateSearch: pageSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) =>
    prefetchLive(context, topicPageQuery(params.forum, params.topic, deps.page ?? 1)),
});

function Post({ post }: { post: TopicPost }) {
  return (
    <Panel id={`post_${post.id}`} className="post">
      <div className="post__body">
        <div className="post__sender">
          <Avatar name={post.author} src={post.avatarUrl ?? null} />
          <strong>{post.author}</strong>
          <RelativeTime className="content-page__meta" dateTime={post.createdAt} />
        </div>
        {post.bodyHtml === undefined ? (
          // Only the markup the author wrote, as plain text.
          <p className="post__plain">{post.body}</p>
        ) : (
          <Prose html={post.bodyHtml} />
        )}
      </div>
    </Panel>
  );
}

/** `/forums/:forum/topics/:topic`: a topic and one page of its posts. */
function TopicPage() {
  const { forum, topic } = Route.useParams();
  const { page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { kind, data, error, isPending, refetch } = useLiveQuery(topicPageQuery(forum, topic, page));

  return (
    <div className="content-page">
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="topic">
        {info => {
          const pageCount = Math.max(1, Math.ceil(info.postCount / POSTS_PER_PAGE));

          return (
            <>
              <p className="content-page__meta">
                <Link to="/forums">Forums</Link> &raquo;{' '}
                <Link to="/forums/$forum" params={{ forum: info.forumSlug }}>
                  {info.forumName}
                </Link>
              </p>
              <h1 className="content-page__title">{info.title}</h1>
              <p className="content-page__meta">
                Started by {info.author}
                {info.startedAt === undefined ? null : (
                  <>
                    {' '}
                    <RelativeTime dateTime={info.startedAt} />
                  </>
                )}
                {' · '}
                {info.postCount} {info.postCount === 1 ? 'post' : 'posts'}
              </p>
              {pageCount > 1 ? (
                <Pagination
                  label="Posts"
                  page={page}
                  pageCount={pageCount}
                  onPageChange={nextPage => {
                    void navigate({ search: { page: nextPage } });
                  }}
                />
              ) : null}
              {info.posts.map(post => (
                <Post key={post.id} post={post} />
              ))}
              {pageCount > 1 ? (
                <Pagination
                  label="Posts, bottom"
                  page={page}
                  pageCount={pageCount}
                  onPageChange={nextPage => {
                    void navigate({ search: { page: nextPage } });
                  }}
                />
              ) : null}
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
