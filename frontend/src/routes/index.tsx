import { createFileRoute } from '@tanstack/react-router';
import { Clock } from 'lucide-react';

import { ActivityFeeds, ActivitySpotlight } from '#/components/home/ActivitySidebar';
import { MediaGrid } from '#/components/home/MediaGrid';
import { WatchedImages } from '#/components/home/WatchedImages';
import { currentUser, images, totalImages } from '#/lib/mock/data';

export const Route = createFileRoute('/')({ component: Home });

// Source order is the phone's reading order: featured and trending images, the
// recent grid, watched images, then the text feeds. The two-column desktop
// layout is a grid rearrangement of exactly this, in `index.css`.
function Home() {
  return (
    <div className="home">
      <ActivitySpotlight />
      <div className="home__main">
        <MediaGrid
          headingLevel={1}
          size="large"
          label="Recent"
          icon={<Clock size={16} />}
          images={images}
          total={totalImages}
        />
        {currentUser ? <WatchedImages /> : null}
      </div>
      <ActivityFeeds />
    </div>
  );
}
