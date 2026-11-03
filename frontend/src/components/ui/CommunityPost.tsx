import { Avatar } from '#/components/ui/Avatar';
import { Panel } from '#/components/ui/Panel';
import { Prose } from '#/components/ui/Prose';
import { RelativeTime } from '#/components/ui/RelativeTime';
import type { RenderedPost } from '#/lib/api/backend/content';

/**
 * A forum post or an image comment: who wrote it, when, and what they wrote.
 * `idPrefix` is what its anchor is called (`post_`, `comment_`), as on the sites.
 */
export function CommunityPost({ post, idPrefix }: { post: RenderedPost; idPrefix: string }) {
  return (
    <Panel id={`${idPrefix}${post.id}`} className="post">
      <div className="post__body">
        <div className="post__sender">
          <Avatar name={post.author} src={post.avatarUrl ?? null} />
          <strong>{post.author}</strong>
          <RelativeTime className="content-page__meta" dateTime={post.createdAt} />
        </div>
        {post.bodyHtml === undefined ? (
          // Only the markup the author wrote, as plain text.
          <p className="post__plain">{post.body}</p>
        ) : (
          <Prose html={post.bodyHtml} />
        )}
      </div>
    </Panel>
  );
}
