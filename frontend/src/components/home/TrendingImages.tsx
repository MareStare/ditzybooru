import { TrendingUp } from 'lucide-react';

import { topScoring } from '#/lib/mock/data';
import { searchSorts } from '#/lib/mock/site';
import { SidebarBlock } from './SidebarBlock';
import { MediaBox } from './MediaBox';

const trendingQuery = `/search?q=${encodeURIComponent('first_seen_at.gt:3 days ago')}&sf=${searchSorts.wilsonScore.sf}&sd=${searchSorts.wilsonScore.sd}`;

export function TrendingImages() {
  return (
    <SidebarBlock
      title="Trending"
      href={trendingQuery}
      icon={<TrendingUp className="size-4 text-primary" />}
      bodyClassName="grid grid-cols-2 gap-2 py-2"
    >
      {topScoring.map(image => (
        <MediaBox key={image.id} image={image} src={image.representations.thumbSmall} />
      ))}
    </SidebarBlock>
  );
}
