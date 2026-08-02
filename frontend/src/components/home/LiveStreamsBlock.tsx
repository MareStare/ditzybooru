import { Radio } from 'lucide-react';

import { channels } from '#/lib/mock/data';
import type { LiveStreamChannel } from '#/lib/types';
import { Badge, BadgeDot } from '#/components/ui/Badge';
import { Int } from '#/components/ui/Int';
import { PanelList } from '#/components/ui/Panel';
import { SidebarBlock } from './SidebarBlock';

function ChannelStrip({ channel }: { channel: LiveStreamChannel }) {
  return (
    <li className="channel-row">
      <a href={`/channels/${channel.shortName}`} className="channel-row__link">
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
              LIVE
            </Badge>
          </span>
        ) : (
          <Badge variant="danger">OFF AIR</Badge>
        )}
      </a>
    </li>
  );
}

export function LiveStreamsBlock() {
  return (
    <SidebarBlock title="Live Streams" href="/channels" icon={<Radio size={16} />}>
      <PanelList>
        {channels.map(channel => (
          <ChannelStrip key={channel.id} channel={channel} />
        ))}
      </PanelList>
    </SidebarBlock>
  );
}
