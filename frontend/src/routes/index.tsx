import { createFileRoute } from '@tanstack/react-router';
import { ArrowUp, Clock, Dices, EyeOff } from 'lucide-react';

import { ActivitySidebar } from '#/components/home/ActivitySidebar';
import { MediaGrid } from '#/components/home/MediaGrid';
import { WatchedImages } from '#/components/home/WatchedImages';
import { currentUser, hiddenImages, images, randomImages, topAllTime, totalImages } from '#/lib/mock/data';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <div className="home">
      <ActivitySidebar />
      <div className="home__main">
        <MediaGrid
          headingLevel={1}
          size="large"
          tabs={[
            {
              query: '*',
              label: 'Recent',
              icon: <Clock size={16} />,
              images,
              total: totalImages,
            },
            {
              query: '*',
              label: 'Top (all time)',
              icon: <ArrowUp size={16} />,
              images: topAllTime,
              total: totalImages,
            },
            {
              query: '*',
              label: 'Random',
              icon: <Dices size={16} />,
              images: randomImages,
              total: totalImages,
            },
            {
              query: 'my:hidden',
              label: 'Hidden',
              icon: <EyeOff size={16} />,
              images: hiddenImages,
              total: hiddenImages.length,
            },
          ]}
        />
        {currentUser ? <WatchedImages /> : null}
      </div>
    </div>
  );
}
