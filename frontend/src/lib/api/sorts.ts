/** Philomena's `sf`/`sd` sort pairs, as both the API and its search URLs take
 *  them. */
export const searchSorts = {
  wilsonScore: { sf: 'wilson_score', sd: 'desc' },
  score: { sf: 'score', sd: 'desc' },
  commentCount: { sf: 'comment_count', sd: 'desc' },
  createdAt: { sf: 'created_at', sd: 'desc' },
} as const;

/** How recent an image must be to count as trending. Philomena's own
 *  "Trending" link uses the same window. */
export const TRENDING_WINDOW = 'first_seen_at.gt:3 days ago';
