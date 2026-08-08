import { Link } from '@tanstack/react-router';
import { MessageCircle } from 'lucide-react';

import { comments } from '#/lib/mock/data';
import type { Comment } from '#/lib/types';
import { searchSorts } from '#/lib/mock/site';
import { timeAgo } from '#/lib/format';
import { PanelList } from '#/components/ui/Panel';
import { SidebarBlock } from './SidebarBlock';
import { UserAttribution } from './UserAttribution';

function CommentStrip({ comment }: { comment: Comment }) {
  const imageId = comment.imageId;

  return (
    <li className="comment-row">
      <Link
        // @ts-expect-error TODO: route not built yet
        to={`/images/${imageId}`}
        aria-label={`Image ${imageId}`}
      >
        <img src={comment.imageThumbTiny} alt="" loading="lazy" className="comment-row__thumb" />
      </Link>
      <div className="comment-row__text">
        <div className="comment-row__head">
          <Link
            // @ts-expect-error TODO: route not built yet
            to={`/images/${imageId}#comment_${comment.id}`}
            className="comment-row__id"
          >
            #{imageId}
          </Link>{' '}
          <span className="comment-row__by">by</span> <UserAttribution author={comment.author} />
        </div>
        <div className="comment-row__time">{timeAgo(new Date(comment.createdAt))}</div>
      </div>
    </li>
  );
}

const mostCommentedQuery = `/search?q=${encodeURIComponent('first_seen_at.gt:3 days ago')}&sf=${searchSorts.commentCount.sf}&sd=${searchSorts.commentCount.sd}`;

/** "Recent Comments" block. */
export function RecentCommentsBlock() {
  return (
    <SidebarBlock
      title="Recent Comments"
      href="/comments"
      icon={<MessageCircle size={16} />}
      footer={{ label: 'Most Commented-on Images', href: mostCommentedQuery }}
    >
      <PanelList>
        {comments.map(comment => (
          <CommentStrip key={comment.id} comment={comment} />
        ))}
      </PanelList>
    </SidebarBlock>
  );
}
