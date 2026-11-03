import { createFileRoute, Link } from '@tanstack/react-router';

import { Panel, PanelBody, PanelHeader } from '#/components/ui/Panel';
import { QueryState } from '#/components/ui/QueryState';
import { Tag, TagList } from '#/components/ui/Tag';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { tagQuery } from '#/lib/api/queries';

export const Route = createFileRoute('/tags/$slug')({
  component: TagPage,
  loader: ({ context, params }) => prefetchLive(context, tagQuery(params.slug)),
});

function TagChips({ names }: { names: Array<string> }) {
  return (
    <TagList>
      {names.map(name => (
        <li key={name}>
          <Tag href={`/search?q=${encodeURIComponent(name)}`}>{name}</Tag>
        </li>
      ))}
    </TagList>
  );
}

function TagSection({ title, names }: { title: string; names: Array<string> }) {
  if (names.length === 0) {
    return null;
  }

  return (
    <Panel>
      <PanelHeader>{title}</PanelHeader>
      <PanelBody>
        <TagChips names={names} />
      </PanelBody>
    </Panel>
  );
}

/** `/tags/:slug`: what the site says about one tag. */
function TagPage() {
  const { slug } = Route.useParams();
  const { kind, data, error, isPending, refetch } = useLiveQuery(tagQuery(slug));

  return (
    <div className="content-page">
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="tag">
        {tag => (
          <>
            <p className="content-page__meta">
              <Link to="/search" search={{ q: tag.name, page: 1 }}>
                {tag.imageCount.toLocaleString()} images
              </Link>
              {tag.category === null ? null : <> &middot; {tag.category}</>}
            </p>
            <h1 className="content-page__title">{tag.name}</h1>
            {tag.aliasedTag === null ? null : (
              <p>
                This tag is an alias of{' '}
                <Link to="/tags/$slug" params={{ slug: tag.aliasedTag }}>
                  {tag.aliasedTag}
                </Link>
                .
              </p>
            )}
            {tag.description === '' ? null : <p style={{ whiteSpace: 'pre-wrap' }}>{tag.description}</p>}
            <TagSection title="Aliases" names={tag.aliases} />
            <TagSection title="Implies" names={tag.impliedTags} />
            <TagSection title="Implied by" names={tag.impliedByTags} />
          </>
        )}
      </QueryState>
    </div>
  );
}
