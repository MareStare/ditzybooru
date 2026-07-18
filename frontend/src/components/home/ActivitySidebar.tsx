import { FeaturedImage } from './FeaturedImage';
import { TrendingImages } from './TrendingImages';
import { StreamsBlock } from './StreamsBlock';
import { ForumActivityBlock } from './ForumActivityBlock';
import { RecentCommentsBlock } from './RecentCommentsBlock';

/**
 * The left activity sidebar of the home page. Hidden on small screens, matching
 * Philomena's `.hide-mobile` sidebar behaviour.
 */
export function ActivitySidebar() {
  return (
    <aside className="hidden w-full shrink-0 flex-col gap-3 lg:flex lg:w-[330px]">
      <FeaturedImage />
      <TrendingImages />
      <StreamsBlock />
      <ForumActivityBlock />
      <RecentCommentsBlock />
    </aside>
  );
}
