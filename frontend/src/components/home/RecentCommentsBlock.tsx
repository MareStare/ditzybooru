import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { MessageCircle } from 'lucide-react';

import type { Comment } from '#/lib/types';
import { useDataSource } from '#/hooks/useDataSource';
import { recentCommentsQuery } from '#/lib/api/queries';
import { TRENDING_WINDOW, searchSorts } from '#/lib/api/sorts';
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

const mostCommentedQuery = `/search?q=${encodeURIComponent(TRENDING_WINDOW)}&sf=${searchSorts.commentCount.sf}&sd=${searchSorts.commentCount.sd}`;

/** How many comments the strip holds. */
export const RECENT_COMMENT_COUNT = 6;

/** "Recent Comments" block. */
export function RecentCommentsBlock() {
  const { data: comments } = useSuspenseQuery(recentCommentsQuery(useDataSource(), RECENT_COMMENT_COUNT));

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
