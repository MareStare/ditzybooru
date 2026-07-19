import { MessagesSquare, Pin } from 'lucide-react';

import { topics } from '#/lib/mock/data';
import type { ForumTopic } from '#/lib/types';
import { SidebarBlock } from './SidebarBlock';
import { UserAttribution } from './UserAttribution';

function TopicStrip({ topic }: { topic: ForumTopic }) {
  return (
    <div className="px-3 py-2 text-sm">
      {topic.sticky ? <Pin className="mr-1 inline size-3 text-muted-foreground" /> : null}
      {topic.lastPost ? (
        <>
          <UserAttribution author={topic.lastPost.author} />{' '}
          <a
            href={`/forums/${topic.forum.slug}/topics/${topic.slug}?post_id=${topic.lastPost.id}#post_${topic.lastPost.id}`}
            className="text-muted-foreground hover:text-foreground"
          >
            replied to
          </a>{' '}
        </>
      ) : null}
      <a href={`/forums/${topic.forum.slug}/topics/${topic.slug}`} className="font-medium hover:text-primary">
        {topic.title}
      </a>{' '}
      <span className="text-muted-foreground">in</span>{' '}
      <a href={`/forums/${topic.forum.slug}`} className="text-muted-foreground hover:text-foreground">
        {topic.forum.name}
      </a>
    </div>
  );
}

/** "Forum Activity" block: recently active topics. */
export function ForumActivityBlock() {
  return (
    <SidebarBlock title="Forum Activity" href="/forums" icon={<MessagesSquare className="size-4 text-primary" />}>
      <div className="divide-y">
        {topics.map(topic => (
          <TopicStrip key={topic.id} topic={topic} />
        ))}
      </div>
    </SidebarBlock>
  );
}
