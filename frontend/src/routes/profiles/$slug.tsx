import { createFileRoute } from '@tanstack/react-router';

import { Avatar } from '#/components/ui/Avatar';
import { Panel, PanelBody, PanelHeader } from '#/components/ui/Panel';
import { Prose } from '#/components/ui/Prose';
import { QueryState } from '#/components/ui/QueryState';
import { RelativeTime } from '#/components/ui/RelativeTime';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { profileQuery } from '#/lib/api/queries';

export const Route = createFileRoute('/profiles/$slug')({
  component: ProfileRoute,
  loader: ({ context, params }) => prefetchLive(context, profileQuery(params.slug)),
});

/** `/profiles/:slug`: a user, what they say about themselves, and what they have been up to. */
function ProfileRoute() {
  const { slug } = Route.useParams();
  const { kind, data, error, isPending, refetch } = useLiveQuery(profileQuery(slug));

  return (
    <div className="content-page">
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="profile">
        {profile => (
          <>
            <div className="profile-top">
              <Avatar name={profile.name} src={profile.avatarUrl} />
              <h1 className="content-page__title">{profile.name}</h1>
            </div>
            <p className="content-page__meta">
              Member since <RelativeTime dateTime={profile.createdAt} />
              {' · '}
              <a href={`/search?q=${encodeURIComponent(`uploader_id:${profile.id}`)}`}>Uploads</a>
              {' · '}
              <a href={`/search?q=${encodeURIComponent(`faved_by_id:${profile.id}`)}`}>Favorites</a>
              {' · '}
              <a href={`/comments?cq=${encodeURIComponent(`author_id:${profile.id}`)}`}>Comments</a>
            </p>
            {profile.aboutHtml === null || profile.aboutHtml === '' ? null : (
              <Panel>
                <PanelHeader>About me</PanelHeader>
                <PanelBody>
                  <Prose html={profile.aboutHtml} />
                </PanelBody>
              </Panel>
            )}
            <Panel>
              <PanelHeader>Statistics (last 90 days)</PanelHeader>
              <PanelBody>
                <dl className="profile-stats">
                  {profile.stats.map(stat => (
                    <div key={stat.label}>
                      <dt>{stat.label}</dt>
                      <dd>{stat.value.toLocaleString()}</dd>
                    </div>
                  ))}
                </dl>
              </PanelBody>
            </Panel>
          </>
        )}
      </QueryState>
    </div>
  );
}
