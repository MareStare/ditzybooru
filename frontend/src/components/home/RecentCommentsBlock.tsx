import { MessageCircle } from 'lucide-react';

import { comments } from '#/lib/mock/data';
import type { Comment } from '#/lib/types';
import { searchSorts } from '#/lib/mock/site';
import { timeAgo } from '#/lib/format';
import { SidebarBlock } from './SidebarBlock';
import { UserAttribution } from './UserAttribution';

function CommentStrip({ comment }: { comment: Comment }) {
  const imageId = String(comment.imageId);

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm odd:bg-muted/30">
      <a href={`/images/${imageId}`} className="shrink-0">
        <img src={comment.imageThumbTiny} alt="" loading="lazy" className="size-10 rounded object-cover" />
      </a>
      <div className="min-w-0 flex-1 leading-snug">
        <div className="truncate">
          <a href={`/images/${imageId}#comment_${String(comment.id)}`} className="font-medium hover:text-primary">
            #{comment.imageId}
          </a>{' '}
          <span className="text-muted-foreground">by</span> <UserAttribution author={comment.author} />
        </div>
        <div className="text-xs text-muted-foreground">{timeAgo(new Date(comment.createdAt))}</div>
      </div>
    </div>
  );
}

const mostCommentedQuery = `/search?q=${encodeURIComponent('first_seen_at.gt:3 days ago')}&sf=${searchSorts.commentCount.sf}&sd=${searchSorts.commentCount.sd}`;

/** "Recent Comments" block. */
export function RecentCommentsBlock() {
  return (
    <SidebarBlock
      title="Recent Comments"
      href="/comments"
      icon={<MessageCircle className="size-4 text-primary" />}
      footer={{ label: 'Most Commented-on Images', href: mostCommentedQuery }}
    >
      <div className="divide-y">
        {comments.map(comment => (
          <CommentStrip key={comment.id} comment={comment} />
        ))}
      </div>
    </SidebarBlock>
  );
}
