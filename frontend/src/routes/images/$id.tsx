import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, EyeOff, MessageSquare, Shuffle, Star } from 'lucide-react';

import { Button } from '#/components/ui/Button';
import { CommunityPost } from '#/components/ui/CommunityPost';
import { Pagination } from '#/components/ui/Pagination';
import { Panel, PanelBody, PanelHeader } from '#/components/ui/Panel';
import { Prose } from '#/components/ui/Prose';
import { QueryState } from '#/components/ui/QueryState';
import { RelativeTime } from '#/components/ui/RelativeTime';
import { useImageActions } from '#/hooks/use-image-actions';
import { useLiveQuery } from '#/hooks/use-live-query';
import { COMMENTS_PER_PAGE } from '#/lib/api/backend/content';
import type { ImagePage } from '#/lib/api/backend/content';
import { prefetchLive } from '#/lib/api/prefetch';
import { imageCommentsQuery, imagePageQuery, neighbourQuery } from '#/lib/api/queries';
import { formatBytes } from '#/lib/format';
import { pageSearch } from '#/lib/page-search';
import type { PageSearch } from '#/lib/page-search';

/** `q` is the search the reader came from: the previous and next images are the ones beside this in it. */
interface ImageSearch extends PageSearch {
  q?: string;
}

export const Route = createFileRoute('/images/$id')({
  component: ImageRoute,
  // A bad id is no error of the router's: the page says there is no such image.
  params: {
    parse: ({ id }: { id: string }) => ({ id: Number(id) }),
    stringify: ({ id }: { id: number }) => ({ id: String(id) }),
  },
  validateSearch: (search: Record<string, unknown>): ImageSearch => ({
    ...pageSearch(search),
    ...(typeof search.q === 'string' && search.q !== '' && search.q !== '*' ? { q: search.q } : {}),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    await Promise.all([
      prefetchLive(context, imagePageQuery(params.id)),
      prefetchLive(context, imageCommentsQuery(params.id, deps.page ?? 1)),
    ]);
  },
});

/** The image itself: a video for a video, otherwise a picture that links to the full file. */
function ImageMedia({ image }: { image: ImagePage }) {
  const { representations: reprs } = image;
  if (image.mimeType.startsWith('video/')) {
    return (
      <video
        className="image-page__media"
        src={reprs.full}
        poster={reprs.large}
        width={image.width}
        height={image.height}
        controls
        loop
        playsInline
      />
    );
  }
  // A GIF would stop moving in any other size, and a vector scales on its own.
  const still = image.mimeType === 'image/gif' || image.mimeType === 'image/svg+xml' ? reprs.full : reprs.large;

  return (
    <a href={reprs.full} rel="nofollow">
      <img className="image-page__media" src={still} width={image.width} height={image.height} alt="" />
    </a>
  );
}

/** Previous, next and random: the images beside this one in the search the reader came from. */
function Navigation({ id }: { id: number }) {
  const { q = '*' } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prev = useLiveQuery(neighbourQuery(id, q, 'prev'));
  const next = useLiveQuery(neighbourQuery(id, q, 'next'));
  const search = q === '*' ? {} : { q };

  return (
    <nav className="image-page__navigation" aria-label="Image navigation">
      {prev.data === undefined || prev.data === null ? null : (
        <Link to="/images/$id" params={{ id: prev.data }} search={search} rel="prev">
          <ChevronLeft size={16} /> Previous
        </Link>
      )}
      <Button
        onClick={() => {
          // Fetched on the click, not ahead of it: a random pick is worth nothing once seen.
          void queryClient
            .query({ ...neighbourQuery(id, q, 'random'), staleTime: 0 })
            .then(pick => (pick === null ? undefined : navigate({ to: '/images/$id', params: { id: pick }, search })));
        }}
      >
        <Shuffle size={16} /> Random
      </Button>
      {next.data === undefined || next.data === null ? null : (
        <Link to="/images/$id" params={{ id: next.data }} search={search} rel="next">
          Next <ChevronRight size={16} />
        </Link>
      )}
    </nav>
  );
}

/** Score and the buttons that change it: upvote, fave, downvote, hide. */
function Interactions({ image }: { image: ImagePage }) {
  const { signedIn, counters, activity, act, busy, failed } = useImageActions(image.id, image);

  return (
    // `data-ready`: the site has said what the visitor did before, so the buttons show it.
    <div className="image-page__interactions" data-ready={activity !== undefined}>
      <Button
        icon
        title={signedIn ? 'Upvote' : 'Sign in to vote'}
        aria-label="Upvote"
        aria-pressed={activity?.voted === 'up'}
        disabled={!signedIn || busy}
        onClick={() => {
          act(activity?.voted === 'up' ? 'unvote' : 'upvote');
        }}
      >
        <ArrowUp size={16} />
      </Button>
      <span className="image-page__score" title="Score">
        {counters.score}
      </span>
      <Button
        icon
        title={signedIn ? 'Downvote' : 'Sign in to vote'}
        aria-label="Downvote"
        aria-pressed={activity?.voted === 'down'}
        disabled={!signedIn || busy}
        onClick={() => {
          act(activity?.voted === 'down' ? 'unvote' : 'downvote');
        }}
      >
        <ArrowDown size={16} />
      </Button>
      <Button
        title={signedIn ? 'Fave' : 'Sign in to fave'}
        aria-label="Fave"
        aria-pressed={activity?.faved === true}
        disabled={!signedIn || busy}
        onClick={() => {
          act(activity?.faved === true ? 'unfave' : 'fave');
        }}
      >
        <Star size={16} /> {counters.faves}
      </Button>
      <Button
        title={signedIn ? 'Hide from your listings' : 'Sign in to hide images'}
        aria-label="Hide"
        aria-pressed={activity?.hidden === true}
        disabled={!signedIn || busy}
        onClick={() => {
          act(activity?.hidden === true ? 'unhide' : 'hide');
        }}
      >
        <EyeOff size={16} /> Hide
      </Button>
      {signedIn ? null : (
        <Link to="/sessions/new" className="content-page__meta">
          Sign in to vote and fave
        </Link>
      )}
      {failed ? <span className="content-page__meta">The site did not take that. Try again.</span> : null}
    </div>
  );
}

function Details({ image }: { image: ImagePage }) {
  return (
    <p className="content-page__meta image-page__details">
      Uploaded <RelativeTime dateTime={image.createdAt} />
      {image.uploader === undefined || image.uploader === null ? null : (
        <>
          {' '}
          by <strong>{image.uploader}</strong>
        </>
      )}
      {' · '}
      {image.width}×{image.height} · {image.mimeType.replace(/^\w+\//, '').toUpperCase()} ·{' '}
      {formatBytes(image.sizeBytes)}
    </p>
  );
}

function Description({ image }: { image: ImagePage }) {
  if (image.descriptionHtml !== undefined && image.descriptionHtml !== null) {
    return (
      <Panel>
        <PanelHeader>Description</PanelHeader>
        <PanelBody>
          <Prose html={image.descriptionHtml} />
        </PanelBody>
      </Panel>
    );
  }
  if (image.description !== undefined && image.description !== '') {
    return (
      <Panel>
        <PanelHeader>Description</PanelHeader>
        <PanelBody>
          <p className="post__plain">{image.description}</p>
        </PanelBody>
      </Panel>
    );
  }

  return null;
}

function Tags({ image }: { image: ImagePage }) {
  return (
    <Panel>
      <PanelHeader>Tags</PanelHeader>
      <PanelBody>
        <ul className="image-page__tags">
          {image.tags.map(tag => (
            <li key={tag.name}>
              <Link to="/tags/$slug" params={{ slug: tag.slug ?? tag.name }} className="image-page__tag">
                {tag.name}
                {tag.imageCount === undefined ? null : <span className="content-page__meta"> {tag.imageCount}</span>}
              </Link>
            </li>
          ))}
        </ul>
        {image.sourceUrls.length === 0 ? null : (
          <p className="content-page__meta">
            Source:{' '}
            {image.sourceUrls.map(url => (
              <a key={url} href={url} rel="noreferrer nofollow noopener">
                {url}{' '}
              </a>
            ))}
          </p>
        )}
      </PanelBody>
    </Panel>
  );
}

function Comments({ id }: { id: number }) {
  const { page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { kind, data, error, isPending, refetch } = useLiveQuery(imageCommentsQuery(id, page));

  return (
    <section id="comments" className="image-page__comments">
      <h2 className="staff-group__title">
        <MessageSquare size={16} /> Comments
      </h2>
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="list of comments">
        {comments => {
          const pageCount = Math.max(1, Math.ceil(comments.total / COMMENTS_PER_PAGE));

          return (
            <>
              {comments.items.length === 0 ? <p className="content-page__meta">No comments yet.</p> : null}
              {comments.items.map(comment => (
                <CommunityPost key={comment.id} post={comment} idPrefix="comment_" />
              ))}
              {pageCount > 1 ? (
                <Pagination
                  label="Comments"
                  page={page}
                  pageCount={pageCount}
                  onPageChange={nextPage => {
                    void navigate({ search: { page: nextPage }, hash: 'comments' });
                  }}
                />
              ) : null}
            </>
          );
        }}
      </QueryState>
    </section>
  );
}

/** `/images/:id`: the image, what is known about it, and what people said. */
function ImageRoute() {
  const { id } = Route.useParams();
  const { kind, data, error, isPending, refetch } = useLiveQuery(imagePageQuery(id));

  return (
    <div className="content-page image-page">
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="image">
        {image => (
          <>
            <Navigation key={image.id} id={image.id} />
            <Interactions key={image.id} image={image} />
            <Details image={image} />
            <ImageMedia image={image} />
            <Description image={image} />
            <Tags image={image} />
            <Comments id={image.id} />
          </>
        )}
      </QueryState>
    </div>
  );
}
