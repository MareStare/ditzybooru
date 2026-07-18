import { createFileRoute } from '@tanstack/react-router';

import { ActivitySidebar } from '#/components/home/ActivitySidebar';
import { ImageList } from '#/components/home/ImageList';
import { WatchedImages } from '#/components/home/WatchedImages';
import { currentUser, images, totalImages } from '#/lib/mock/data';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <div className="px-3 py-4 md:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <ActivitySidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ImageList title="Recently Uploaded" images={images} total={totalImages} />
          {currentUser ? <WatchedImages /> : null}
        </div>
      </div>
    </div>
  );
}
