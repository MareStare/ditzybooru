import type { Attribution } from '#/lib/types';

/** Renders a comment/post author as a profile link, or plain anonymous text. */
export function UserAttribution({ author }: { author: Attribution }) {
  if (author.user) {
    return (
      <a href={`/profiles/${author.user.slug}`} className="font-medium text-foreground hover:text-primary">
        {author.user.name}
      </a>
    );
  }

  return <span className="font-medium text-muted-foreground">{author.anonymousName ?? 'Anonymous'}</span>;
}
