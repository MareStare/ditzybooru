import { Link } from '@tanstack/react-router';
import { MessagesSquare, Pin } from 'lucide-react';

import { topics } from '#/lib/mock/data';
import type { ForumTopic } from '#/lib/types';
import { PanelList } from '#/components/ui/Panel';
import { SidebarBlock } from './SidebarBlock';
import { UserAttribution } from './UserAttribution';

function TopicStrip({ topic }: { topic: ForumTopic }) {
  return (
    <li className="forum-topic">
      {topic.sticky ? <Pin className="forum-topic__pin" size={12} /> : null}
      {topic.lastPost ? (
        <>
          <UserAttribution author={topic.lastPost.author} />{' '}
          <Link
            // @ts-expect-error TODO: route not built yet
            to={`/forums/${topic.forum.slug}/topics/${topic.slug}?post_id=${topic.lastPost.id}#post_${topic.lastPost.id}`}
            className="forum-topic__meta"
          >
            replied to
          </Link>{' '}
        </>
      ) : null}
      <Link
        // @ts-expect-error TODO: route not built yet
        to={`/forums/${topic.forum.slug}/topics/${topic.slug}`}
        className="forum-topic__title"
      >
        {topic.title}
      </Link>{' '}
      <span className="forum-topic__meta">in</span>{' '}
      <Link
        // @ts-expect-error TODO: route not built yet
        to={`/forums/${topic.forum.slug}`}
        className="forum-topic__meta"
      >
        {topic.forum.name}
      </Link>
    </li>
  );
}

/** "Forum Activity" block: recently active topics. */
export function ForumActivityBlock() {
  return (
    <SidebarBlock title="Forum Activity" href="/forums" icon={<MessagesSquare size={16} />}>
      <PanelList>
        {topics.map(topic => (
          <TopicStrip key={topic.id} topic={topic} />
        ))}
      </PanelList>
    </SidebarBlock>
  );
}
