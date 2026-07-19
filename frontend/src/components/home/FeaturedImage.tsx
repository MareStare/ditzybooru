import { featuredImage } from '#/lib/mock/data';
import { MediaBox } from './MediaBox';

/** The featured image spotlighted at the top of the activity sidebar. */
export function FeaturedImage() {
  return (
    <section className="overflow-hidden rounded-xl bg-card border">
      <h4 className="px-3 py-2 text-center text-md font-semibold">Featured</h4>
      <MediaBox className="border-none" image={featuredImage} src={featuredImage.representations.medium} />
    </section>
  );
}
