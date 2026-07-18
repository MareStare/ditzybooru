import { ArrowUp, Star, TrendingUp } from 'lucide-react';

import { topScoring } from '#/lib/mock/data';
import { searchSorts } from '#/lib/mock/site';
import type { Image } from '#/lib/types';
import { formatCount } from '#/lib/format';
import { SidebarBlock } from './SidebarBlock';
import { MediaThumb, imageTitle } from './MediaThumb';

function TrendingThumb({ image }: { image: Image }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <MediaThumb
        image={image}
        src={image.representations.thumbSmall}
        title={imageTitle(image)}
        className="aspect-square"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent px-1.5 pt-4 pb-1 text-[11px] font-medium text-white tabular-nums">
        <span className="inline-flex items-center gap-0.5">
          <ArrowUp className="size-3" />
          {formatCount(image.score)}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <Star className="size-3" />
          {formatCount(image.faves)}
        </span>
      </div>
    </div>
  );
}

const trendingQuery = `/search?q=${encodeURIComponent('first_seen_at.gt:3 days ago')}&sf=${searchSorts.wilsonScore.sf}&sd=${searchSorts.wilsonScore.sd}`;
const topScoringQuery = `/search?q=*&sf=${searchSorts.score.sf}&sd=${searchSorts.score.sd}`;

/** "Trending Images" block: the top-scoring images from the last few days. */
export function TrendingImages() {
  return (
    <SidebarBlock
      title="Trending"
      href={trendingQuery}
      icon={<TrendingUp className="size-4 text-primary" />}
      bodyClassName="grid grid-cols-2 gap-2 p-2"
    >
      {topScoring.map(image => (
        <TrendingThumb key={image.id} image={image} />
      ))}
    </SidebarBlock>
  );
}
