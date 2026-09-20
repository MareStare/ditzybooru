import { useSuspenseQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';

import { useDataSource } from '#/hooks/useDataSource';
import { trendingMediaQuery } from '#/lib/api/queries';
import { TRENDING_WINDOW, searchSorts } from '#/lib/api/sorts';
import { SidebarBlock } from './SidebarBlock';
import { MediaBox } from './MediaBox';

/** How many thumbnails the block holds. Its grid is two by two. */
export const TRENDING_COUNT = 4;

const trendingQuery = `/search?q=${encodeURIComponent(TRENDING_WINDOW)}&sf=${searchSorts.wilsonScore.sf}&sd=${searchSorts.wilsonScore.sd}`;

export function TrendingImages() {
  const { data: images } = useSuspenseQuery(trendingMediaQuery(useDataSource(), TRENDING_COUNT));

  return (
    <SidebarBlock title="Trending" href={trendingQuery} icon={<TrendingUp size={16} />} bodyClassName="trending-grid">
      {images.map(image => (
        <MediaBox key={image.id} image={image} src={image.representations.thumbSmall} />
      ))}
    </SidebarBlock>
  );
}
