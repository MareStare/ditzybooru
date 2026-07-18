import { featuredImage } from '#/lib/mock/data';
import { MediaThumb, imageTitle } from './MediaThumb';

/** The featured image spotlighted at the top of the activity sidebar. */
export function FeaturedImage() {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <h4 className="border-b px-3 py-2 text-center text-sm font-semibold">Featured Image</h4>
      <MediaThumb
        image={featuredImage}
        src={featuredImage.representations.medium}
        title={imageTitle(featuredImage)}
        className="aspect-square"
      />
    </section>
  );
}
