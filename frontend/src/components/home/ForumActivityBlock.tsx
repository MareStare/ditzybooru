import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { MessagesSquare, Pin } from 'lucide-react';

import { Button } from '#/components/ui/Button';
import { PanelList } from '#/components/ui/Panel';
import { RelativeTime } from '#/components/ui/RelativeTime';
import { useDataSource } from '#/hooks/use-data-source';
import { useInView } from '#/hooks/use-in-view';
import { recentTopicsQuery } from '#/lib/api/queries';
import type { ForumTopic } from '#/lib/types';
import { SidebarBlock } from './SidebarBlock';

/** How many topics the block holds. */
const FORUM_TOPIC_COUNT = 6;

function TopicStrip({ topic }: { topic: ForumTopic }) {
  return (
    <li className="forum-topic">
      {topic.sticky ? <Pin className="forum-topic__pin" size={12} /> : null}
      <Link
        to="/forums/$forum/topics/$topic"
        params={{ forum: topic.forum.slug, topic: topic.slug }}
        className="forum-topic__title"
      >
        {topic.title}
      </Link>{' '}
      <span className="forum-topic__meta">in</span>{' '}
      <Link to="/forums/$forum" params={{ forum: topic.forum.slug }} className="forum-topic__meta">
        {topic.forum.name}
      </Link>{' '}
      <RelativeTime className="forum-topic__meta" dateTime={topic.lastRepliedAt} />
    </li>
  );
}

/**
 * "Forum Activity" block: recently active topics.
 *
 * The slowest request on the page - the backend asks every forum - so it is
 * neither in the route loader nor in the server render. It loads in the browser
 * once the block is near the viewport, and not at all for a visitor who never
 * scrolls to it.
 */
export function ForumActivityBlock() {
  const kind = useDataSource();
  const [ref, inView] = useInView();
  const {
    data: topics,
    isError,
    refetch,
  } = useQuery({ ...recentTopicsQuery(kind, FORUM_TOPIC_COUNT), enabled: inView });

  let body;
  if (topics !== undefined) {
    body = (
      <PanelList>
        {topics.map(topic => (
          <TopicStrip key={`${topic.forum.slug}/${topic.slug}`} topic={topic} />
        ))}
      </PanelList>
    );
  } else if (isError) {
    body = (
      <div className="forum-activity__status">
        <span className="forum-topic__meta">Could not load forum activity.</span>
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
    body = <div className="forum-activity__status forum-topic__meta">Loading&hellip;</div>;
  }

  return (
    <div ref={ref}>
      <SidebarBlock title="Forum Activity" href="/forums" icon={<MessagesSquare size={16} />}>
        {body}
      </SidebarBlock>
    </div>
  );
}
