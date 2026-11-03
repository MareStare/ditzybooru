import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Radio } from 'lucide-react';

import { useDataSource } from '#/hooks/use-data-source';
import { useInView } from '#/hooks/use-in-view';
import { liveStreamsQuery } from '#/lib/api/queries';
import type { LiveStreamChannel } from '#/lib/types';
import { Badge, BadgeDot } from '#/components/ui/Badge';
import { Button } from '#/components/ui/Button';
import { Int } from '#/components/ui/Int';
import { PanelList } from '#/components/ui/Panel';
import { SidebarBlock } from './SidebarBlock';

function ChannelStrip({ channel }: { channel: LiveStreamChannel }) {
  return (
    <li className="channel-row">
      <Link
        // @ts-expect-error TODO: route not built yet
        to={`/channels/${channel.id}`}
        className="channel-row__link"
      >
        <span className="channel-row__title">
          {channel.title}
          {channel.nsfw ? <span title="NSFW"> 🔞</span> : null}
        </span>

        {channel.isLive ? (
          <span className="channel-row__status">
            <span className="channel-row__viewers">
              <Int value={channel.viewers} /> {channel.viewers === 1 ? 'viewer' : 'viewers'}
            </span>
            <Badge variant="success">
              <BadgeDot />
              {/* Fredoka fits a bare stem so tight that the "IV" reads as one
                  letter. Only this pair needs the air, so it is split here
                  rather than tracked out across every badge on the site. The
                  wrapper keeps the halves out of the badge's flex `gap`. */}
              <span>
                LI<span className="channel-row__kern">VE</span>
              </span>
            </Badge>
          </span>
        ) : (
          <Badge variant="danger">OFF AIR</Badge>
        )}
      </Link>
    </li>
  );
}

/** How many channels the block holds. */
const CHANNEL_COUNT = 6;

/** Live channels first, the busiest on top; the rest keep the site's order. */
function liveFirst(channels: Array<LiveStreamChannel>): Array<LiveStreamChannel> {
  return channels
    .map((channel, index) => ({ channel, index }))
    .sort(
      (a, b) =>
        Number(b.channel.isLive) - Number(a.channel.isLive) ||
        b.channel.viewers - a.channel.viewers ||
        a.index - b.index,
    )
    .map(({ channel }) => channel)
    .slice(0, CHANNEL_COUNT);
}

/**
 * "Live Streams" block. Loaded in the browser once the block is near the
 * viewport rather than with the page, like the forum activity block, and
 * absent altogether on a site that has no livestream page.
 */
export function LiveStreamsBlock() {
  const kind = useDataSource();
  const [ref, inView] = useInView();
  const { data: channels, isError, refetch } = useQuery({ ...liveStreamsQuery(kind), enabled: inView });

  if (channels === null) {
    return null;
  }

  let body;
  if (channels !== undefined) {
    body = (
      <PanelList>
        {liveFirst(channels).map(channel => (
          <ChannelStrip key={channel.id} channel={channel} />
        ))}
      </PanelList>
    );
  } else if (isError) {
    body = (
      <div className="live-streams__status">
        <span className="channel-row__viewers">Could not load the streams.</span>
        <Button
          onClick={() => {
            void refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  } else {
    body = <div className="live-streams__status channel-row__viewers">Loading&hellip;</div>;
  }

  return (
    <div ref={ref}>
      <SidebarBlock title="Live Streams" href="/channels" icon={<Radio size={16} />}>
        {body}
      </SidebarBlock>
    </div>
  );
}
