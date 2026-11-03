/**
 * The fabricated data of `lib/mock` as a {@link DataSource}.
 *
 * Kept alongside the real one so the site can be worked on offline, so the
 * accessibility suite has a fixed page to check, and so a layout can be judged
 * against data that does not change under it.
 */

import { channels, comments, featuredImage, images, topScoring, topics, totalImages } from '#/lib/mock/data';
import type { Comment, ForumTopic, Gallery, LiveStreamChannel, Media } from '#/lib/types';
import type { DataSource, MediaPage, MediaSearchParams } from '#/lib/api/types';

export const mockSource: DataSource = {
  // Every page is the same page: there is one gallery's worth of mock images,
  // and the pagination is here to be looked at rather than walked.
  async searchMedia({ perPage }: MediaSearchParams): Promise<MediaPage> {
    return { images: images.slice(0, perPage), total: totalImages };
  },

  async featuredMedia(): Promise<Media> {
    return featuredImage;
  },

  async trendingMedia(limit: number): Promise<Array<Media>> {
    return topScoring.slice(0, limit);
  },

  async recentComments(limit: number): Promise<Array<Comment>> {
    return comments.slice(0, limit);
  },

  async recentTopics(limit: number): Promise<Array<ForumTopic>> {
    return topics.slice(0, limit);
  },

  async liveStreams(): Promise<Array<LiveStreamChannel>> {
    return channels;
  },

  async gallery(id: number, _page: number, perPage: number): Promise<Gallery> {
    return {
      id,
      title: 'Mock gallery',
      description: 'A made-up gallery, to look at the page with.',
      creator: 'Mock Pony',
      imageTotal: totalImages,
      images: images.slice(0, perPage),
    };
  },
};
