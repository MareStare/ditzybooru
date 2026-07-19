import { createFileRoute } from '@tanstack/react-router';

import { ActivitySidebar } from '#/components/home/ActivitySidebar';
import { ImageGrid } from '#/components/home/MediaGrid';
import { WatchedImages } from '#/components/home/WatchedImages';
import { currentUser, hiddenImages, images, randomImages, topAllTime, totalImages } from '#/lib/mock/data';
import { ArrowUp, Clock, Dices, EyeOff } from 'lucide-react';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <div className="px-3 py-4 md:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <ActivitySidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ImageGrid
            headingLevel={1}
            size="large"
            tabs={[
              {
                query: '*',
                label: 'Recent',
                icon: <Clock className="size-4 text-primary" />,
                images,
                total: totalImages,
              },
              {
                query: '*',
                label: 'Top (all time)',
                icon: <ArrowUp className="size-4 text-primary" />,
                images: topAllTime,
                total: totalImages,
              },
              {
                query: '*',
                label: 'Random',
                icon: <Dices className="size-4 text-primary" />,
                images: randomImages,
                total: totalImages,
              },
              {
                query: 'my:hidden',
                label: 'Hidden',
                icon: <EyeOff className="size-4 text-primary" />,
                images: hiddenImages,
                total: hiddenImages.length,
              },
            ]}
          />
          {currentUser ? <WatchedImages /> : null}
        </div>
      </div>
    </div>
  );
}
