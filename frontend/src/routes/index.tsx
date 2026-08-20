import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Clock } from 'lucide-react';

import { ActivityFeeds, ActivitySpotlight } from '#/components/home/ActivitySidebar';
import { MediaGrid, SEARCH_RESULTS_TRANSITION } from '#/components/home/MediaGrid';
import { WatchedImages } from '#/components/home/WatchedImages';
import { currentUser, images, totalImages } from '#/lib/mock/data';
import { animationsEnabled } from '#/lib/motion';

export const Route = createFileRoute('/')({ component: Home });

/** What the "Recent" grid is a first page of: every image, newest first. */
const RECENT_QUERY = '*';

// Source order is the phone's reading order: featured and trending images, the
// recent grid, watched images, then the text feeds. The two-column desktop
// layout is a grid rearrangement of exactly this, in `index.css`.
function Home() {
  const navigate = useNavigate();

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
          viewTransitionName={SEARCH_RESULTS_TRANSITION}
          paging={{
            // The home grid is only ever the first page. Asking for a second one
            // is asking for the full listing, which lives on /search.
            page: 1,
            onPageChange: page => {
              // The transition carries the grid all the way from wherever the
              // reader clicked to the search page's top; the search route's own
              // effect decides where that is.
              void navigate({
                to: '/search',
                search: { q: RECENT_QUERY, page },
                viewTransition: animationsEnabled(),
              });
            },
          }}
        />
        {currentUser ? <WatchedImages /> : null}
      </div>
      <ActivityFeeds />
    </div>
  );
}
