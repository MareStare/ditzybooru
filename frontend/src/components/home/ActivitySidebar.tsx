import { FeaturedImage } from './FeaturedImage';
import { TrendingImages } from './TrendingImages';
import { LiveStreamsBlock } from './LiveStreamsBlock';
import { ForumActivityBlock } from './ForumActivityBlock';
import { RecentCommentsBlock } from './RecentCommentsBlock';

/**
 * The left activity sidebar of the home page. Hidden on small screens, matching
 * Philomena's `.hide-mobile` sidebar behaviour.
 */
export function ActivitySidebar() {
  return (
    <aside className="activity-sidebar">
      <FeaturedImage />
      <TrendingImages />
      <LiveStreamsBlock />
      <ForumActivityBlock />
      <RecentCommentsBlock />
    </aside>
  );
}
