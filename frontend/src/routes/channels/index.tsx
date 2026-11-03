import { createFileRoute } from '@tanstack/react-router';

import { Badge } from '#/components/ui/Badge';
import { Panel, PanelBody } from '#/components/ui/Panel';
import { QueryState } from '#/components/ui/QueryState';
import { useLiveQuery } from '#/hooks/use-live-query';
import { prefetchLive } from '#/lib/api/prefetch';
import { channelsQuery } from '#/lib/api/queries';

export const Route = createFileRoute('/channels/')({
  component: ChannelsPage,
  loader: ({ context }) => prefetchLive(context, channelsQuery()),
});

/** `/channels`: the tracked livestream channels, live ones first. */
function ChannelsPage() {
  const { kind, data, error, isPending, refetch } = useLiveQuery(channelsQuery());

  return (
    <div className="content-page">
      <h1 className="content-page__title">Livestreams</h1>
      <QueryState kind={kind} data={data} error={error} isPending={isPending} refetch={refetch} what="list of channels">
        {channels =>
          channels.map(channel => (
            <Panel key={channel.id}>
              <PanelBody>
                <img src={channel.thumbnailUrl} alt="" width={160} loading="lazy" />
                <h2>{channel.title}</h2>
                {channel.live ? (
                  <Badge variant="danger">Live{channel.viewers === null ? '' : ` - ${channel.viewers} viewers`}</Badge>
                ) : null}
                {channel.nsfw ? <Badge variant="danger">NSFW</Badge> : null}
                {channel.artistTag === null ? null : (
                  <p className="content-page__meta">
                    <a href={`/search?q=${encodeURIComponent(channel.artistTag)}`}>{channel.artistTag}</a>
                  </p>
                )}
              </PanelBody>
            </Panel>
          ))
        }
      </QueryState>
    </div>
  );
}
