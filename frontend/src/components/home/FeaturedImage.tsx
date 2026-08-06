import { featuredImage } from '#/lib/mock/data';
import { SidebarBlock } from './SidebarBlock';
import { MediaBox } from './MediaBox';

/** The featured image spotlighted at the top of the activity sidebar. */
export function FeaturedImage() {
  return (
    <SidebarBlock title="Featured" className="featured-block">
      <MediaBox className="media-box--bare" image={featuredImage} src={featuredImage.representations.medium} />
    </SidebarBlock>
  );
}
