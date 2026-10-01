import { BrowserRetry } from '#/components/ui/BrowserRetry';
import { useDataSource } from '#/hooks/use-data-source';
import { featuredMediaQuery, recentCommentsQuery, trendingMediaQuery } from '#/lib/api/queries';

import { FeaturedImage } from './FeaturedImage';
import { TRENDING_COUNT, TrendingImages } from './TrendingImages';
import { LiveStreamsBlock } from './LiveStreamsBlock';
import { ForumActivityBlock } from './ForumActivityBlock';
import { RECENT_COMMENT_COUNT, RecentCommentsBlock } from './RecentCommentsBlock';

/**
 * The home page's activity column, in two halves.
 *
 * They are separate components rather than one `<aside>` because the halves do
 * not stay together on a phone: the picture blocks are the best thing on the
 * page and go above the image grid, while the text feeds are a tail and go
 * below it. On a wide screen the grid areas in `routes/index.css` stack them
 * back into a single column.
 */

/** Featured and trending images - the picture half of the column. */
export function ActivitySpotlight() {
  const kind = useDataSource();
  return (
    <aside className="home__spotlight" aria-label="Featured and trending">
      <BrowserRetry queryKey={featuredMediaQuery(kind).queryKey} label="the featured image">
        <FeaturedImage />
      </BrowserRetry>
      <BrowserRetry queryKey={trendingMediaQuery(kind, TRENDING_COUNT).queryKey} label="trending images">
        <TrendingImages />
      </BrowserRetry>
    </aside>
  );
}

/** Streams, forum and comment feeds - the text half of the column. */
export function ActivityFeeds() {
  const kind = useDataSource();
  return (
    <aside className="home__activity" aria-label="Site activity">
      <LiveStreamsBlock />
      <ForumActivityBlock />
      <BrowserRetry queryKey={recentCommentsQuery(kind, RECENT_COMMENT_COUNT).queryKey} label="recent comments">
        <RecentCommentsBlock />
      </BrowserRetry>
    </aside>
  );
}
