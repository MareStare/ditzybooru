import { featuredImage } from '#/lib/mock/data';
import { SidebarBlock } from './SidebarBlock';
import { MediaBox } from './MediaBox';

/** The featured image spotlighted at the top of the activity sidebar. */
export function FeaturedImage() {
  return (
    <SidebarBlock title="Featured">
      <MediaBox className="border-none" image={featuredImage} src={featuredImage.representations.medium} />
    </SidebarBlock>
  );
}
