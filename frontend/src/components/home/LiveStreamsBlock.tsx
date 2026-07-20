import { Radio } from 'lucide-react';

import { channels } from '#/lib/mock/data';
import type { LiveStreamChannel } from '#/lib/types';
import { Badge } from '#/components/ui/badge';
import { Int } from '#/components/ui/int';
import { SidebarBlock } from './SidebarBlock';

function ChannelStrip({ channel }: { channel: LiveStreamChannel }) {
  return (
    <a
      href={`/channels/${channel.shortName}`}
      className="flex items-center gap-2 px-3 py-2 text-sm transition-colors odd:bg-muted/30 hover:bg-muted"
    >
      <span className="min-w-0 flex-1 truncate">
        {channel.title}
        {channel.nsfw ? (
          <span className="ml-1" title="NSFW">
            🔞
          </span>
        ) : null}
      </span>
      {channel.isLive ? (
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="text-xs text-muted-foreground tabular-nums">
            <Int value={channel.viewers} /> {channel.viewers === 1 ? 'viewer' : 'viewers'}
          </span>
          <Badge variant="success" className="gap-1">
            <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
            LIVE
          </Badge>
        </span>
      ) : (
        <Badge variant="danger" className="shrink-0">
          OFF AIR
        </Badge>
      )}
    </a>
  );
}

/** "Streams" block: live and offline channels. */
export function LiveStreamsBlock() {
  return (
    <SidebarBlock title="Live Streams" href="/channels" icon={<Radio className="size-4 text-primary" />}>
      <div className="divide-y">
        {channels.map(channel => (
          <ChannelStrip key={channel.id} channel={channel} />
        ))}
      </div>
    </SidebarBlock>
  );
}
