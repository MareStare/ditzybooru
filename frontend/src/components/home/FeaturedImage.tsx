import { useSuspenseQuery } from '@tanstack/react-query';

import { useDataSource } from '#/hooks/useDataSource';
import { featuredMediaQuery } from '#/lib/api/queries';
import { SidebarBlock } from './SidebarBlock';
import { MediaBox } from './MediaBox';

/** The featured image spotlighted at the top of the activity sidebar. */
export function FeaturedImage() {
  const { data: image } = useSuspenseQuery(featuredMediaQuery(useDataSource()));

  return (
    <SidebarBlock title="Featured" className="featured-block">
      <MediaBox className="media-box--bare" image={image} src={image.representations.medium} />
    </SidebarBlock>
  );
}
