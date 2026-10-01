import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Clock } from 'lucide-react';

import { ActivityFeeds, ActivitySpotlight } from '#/components/home/ActivitySidebar';
import { RECENT_COMMENT_COUNT } from '#/components/home/RecentCommentsBlock';
import { TRENDING_COUNT } from '#/components/home/TrendingImages';
import { MediaGrid, SEARCH_RESULTS_TRANSITION } from '#/components/home/MediaGrid';
import { WatchedImages } from '#/components/home/WatchedImages';
import { useCurrentUser } from '#/hooks/use-current-user';
import { useMediaSearch } from '#/hooks/use-media-search';
import { featuredMediaQuery, mediaSearchQuery, recentCommentsQuery, trendingMediaQuery } from '#/lib/api/queries';
import { animationsEnabled } from '#/lib/motion';

/** What the "Recent" grid is a first page of: every image, newest first. */
const RECENT_QUERY = '*';

export const Route = createFileRoute('/')({
  component: Home,
  // Fetched here rather than in the blocks alone, so the server render has
  // every one of them and the page arrives whole. `staleTime: 'static'` is what
  // makes this fill the cache rather than refetch what is already in it.
  // A failed query does not fail the page. The browser fetches it again.
  loader: async ({ context }) => {
    const { queryClient, settings } = context;
    const kind = settings.dataSource;

    const queries = [
      queryClient.query({
        ...mediaSearchQuery(kind, { query: RECENT_QUERY, page: 1, perPage: settings.components.mediaPerPage }),
        staleTime: 'static',
      }),
      queryClient.query({ ...featuredMediaQuery(kind), staleTime: 'static' }),
      queryClient.query({ ...trendingMediaQuery(kind, TRENDING_COUNT), staleTime: 'static' }),
      queryClient.query({ ...recentCommentsQuery(kind, RECENT_COMMENT_COUNT), staleTime: 'static' }),
    ];

    await Promise.all(queries.map(query => query.catch(() => undefined)));
  },
});

// Source order is the phone's reading order: featured and trending images, the
// recent grid, watched images, then the text feeds. The two-column desktop
// layout is a grid rearrangement of exactly this, in `index.css`.
function Home() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { images, total } = useMediaSearch(RECENT_QUERY, 1);

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
          total={total}
          viewTransitionName={SEARCH_RESULTS_TRANSITION}
          paging={{
            // The home grid is only ever the first page: there is nothing
            // behind it to step back to, and asking for anything ahead of it is
            // asking for the full listing, which lives on /search.
            page: 1,
            back: false,
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
