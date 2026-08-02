import type { Attribution } from '#/lib/types';

/** Renders a comment/post author as a profile link, or plain anonymous text. */
export function UserAttribution({ author }: { author: Attribution }) {
  if (author.user) {
    return (
      <a href={`/profiles/${author.user.slug}`} className="user-attribution">
        {author.user.name}
      </a>
    );
  }

  return <span className="user-attribution">{author.anonymousName ?? 'Anonymous'}</span>;
}
