import { Link } from '@tanstack/react-router';

import type { Attribution } from '#/lib/types';

/** Renders a comment/post author as a profile link, or plain anonymous text. */
export function UserAttribution({ author }: { author: Attribution }) {
  if (author.user) {
    return (
      <Link
        // @ts-expect-error TODO: route not built yet
        to={`/profiles/${author.user.slug}`}
        className="user-attribution"
      >
        {author.user.name}
      </Link>
    );
  }

  return <span className="user-attribution">{author.anonymousName ?? 'Anonymous'}</span>;
}
