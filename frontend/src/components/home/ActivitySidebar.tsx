import { Heart } from 'lucide-react';

import { FeaturedImage } from './FeaturedImage';
import { TrendingImages } from './TrendingImages';
import { StreamsBlock } from './StreamsBlock';
import { ForumActivityBlock } from './ForumActivityBlock';
import { RecentCommentsBlock } from './RecentCommentsBlock';

function DonateBlock() {
  return (
    <div className="rounded-xl border border-green-600/30 bg-green-600/10 px-3 py-2.5 text-center text-sm text-green-700 dark:border-green-500/30 dark:text-green-300">
      <Heart className="mr-1 inline size-3.5" />
      Enjoy the site?{' '}
      <a href="/pages/donations" className="font-semibold underline underline-offset-2">
        Become a patron or donate!
      </a>
    </div>
  );
}

function ContactBlock() {
  return (
    <div className="rounded-xl border bg-card px-3 py-2.5 text-center text-sm text-muted-foreground">
      Issues? Want to chat?{' '}
      <a href="/pages/contact" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
        Contact us!
      </a>
    </div>
  );
}

/**
 * The left activity sidebar of the home page. Hidden on small screens, matching
 * Philomena's `.hide-mobile` sidebar behaviour.
 */
export function ActivitySidebar() {
  return (
    <aside className="hidden w-full shrink-0 flex-col gap-3 lg:flex lg:w-[330px]">
      <FeaturedImage />
      <DonateBlock />
      <ContactBlock />
      <TrendingImages />
      <StreamsBlock />
      <ForumActivityBlock />
      <RecentCommentsBlock />
    </aside>
  );
}
