/** The site's own pages (rules, staff, static pages), read through our API. */

import { get, post, remove } from '#/lib/api/backend/client';

/** A static page such as the privacy policy. */
export interface StaticPage {
  title: string;
  updatedAt: string;
  /** Cleaned by the backend: safe to render. */
  bodyHtml: string;
}

interface Rule {
  id: number;
  title: string;
  important: boolean;
  /** Cleaned by the backend: safe to render. */
  bodyHtml: string;
  examplesHtml: null | string;
}

export interface Rules {
  updatedAt: string;
  items: Array<Rule>;
}

interface StaffMember {
  name: string;
  profileUrl: string;
  avatarUrl: null | string;
  description: string;
}

export interface StaffGroup {
  name: string;
  description: string;
  members: Array<StaffMember>;
}

export function fetchStaticPage(slug: string): Promise<StaticPage> {
  return get<StaticPage>(`/pages/${encodeURIComponent(slug)}`);
}

export function fetchRules(): Promise<Rules> {
  return get<Rules>('/rules');
}

export async function fetchStaff(): Promise<Array<StaffGroup>> {
  const { groups } = await get<{ groups: Array<StaffGroup> }>('/staff');

  return groups;
}

export interface Forum {
  slug: string;
  name: string;
  description: string;
  postCount: number;
  topicCount: number;
}

interface TopicSummary {
  slug: string;
  title: string;
  sticky: boolean;
  locked: boolean;
  postCount: number;
  viewCount: number;
  lastRepliedAt: string;
  author: string;
}

export interface TopicList {
  total: number;
  items: Array<TopicSummary>;
}

export interface RenderedPost {
  id: number;
  author: string;
  /** The path segment of the author's profile; `null` for an anonymous post. */
  authorSlug?: null | string;
  avatarUrl?: null | string;
  createdAt: string;
  /** Cleaned by the backend: safe to render. */
  bodyHtml?: string;
  /** The markup the author wrote, where the site's rendered text is not available. */
  body?: string;
}

export interface TopicPage {
  slug: string;
  title: string;
  forumSlug: string;
  forumName: string;
  author: string;
  startedAt?: string;
  /** Every post of the topic, across pages. */
  postCount: number;
  posts: Array<RenderedPost>;
}

/** How many posts the site puts on a topic page. */
export const POSTS_PER_PAGE = 25;

export async function fetchForums(): Promise<Array<Forum>> {
  const { items } = await get<{ items: Array<Forum> }>('/forums');

  return items;
}

export function fetchForum(slug: string): Promise<Forum> {
  return get<Forum>(`/forums/${encodeURIComponent(slug)}`);
}

export function fetchForumTopics(slug: string, page: number, perPage: number): Promise<TopicList> {
  return get<TopicList>(`/forums/${encodeURIComponent(slug)}/topics`, { page, perPage });
}

export function fetchTopicPage(forum: string, topic: string, page: number): Promise<TopicPage> {
  return get<TopicPage>(`/forums/${encodeURIComponent(forum)}/topics/${encodeURIComponent(topic)}`, { page });
}

interface ImageTag {
  name: string;
  slug?: string;
  category?: null | string;
  imageCount?: number;
}

export interface ImagePage {
  id: number;
  createdAt: string;
  width: number;
  height: number;
  aspectRatio: number;
  tagCount: number;
  score: number;
  upvotes: number;
  downvotes: number;
  faves: number;
  commentCount: number;
  sourceUrls: Array<string>;
  representations: {
    full: string;
    large: string;
    medium: string;
    thumb: string;
  };
  tags: Array<ImageTag>;
  mimeType: string;
  sizeBytes: number;
  uploader?: null | string;
  uploaderSlug?: null | string;
  /** Cleaned by the backend: safe to render. */
  descriptionHtml?: null | string;
  /** The markup the uploader wrote, where the site's rendered text is not available. */
  description?: string;
}

export interface ImageComments {
  total: number;
  items: Array<RenderedPost>;
}

/** The score and counters after a vote, fave or hide. */
export interface ImageCounters {
  score: number;
  upvotes: number;
  downvotes: number;
  faves: number;
}

/** What the visitor has done to an image. */
export interface ImageActivity {
  faved: boolean;
  voted: 'up' | 'down' | null;
  hidden: boolean;
}

/** How many comments the site puts on a page. */
export const COMMENTS_PER_PAGE = 25;

export function fetchImagePage(id: number): Promise<ImagePage> {
  return get<ImagePage>(`/images/${id}`);
}

export function fetchImageComments(id: number, page: number): Promise<ImageComments> {
  return get<ImageComments>(`/images/${id}/comments`, { page });
}

/** Needs the visitor's session cookie; the browser sends it. */
export async function fetchImageActivity(id: number): Promise<ImageActivity> {
  const { interactions } = await get<{
    interactions: Array<{ image_id: number; interaction_type: string; value: null | string }>;
  }>(`/images/${id}/interactions`);
  const mine = interactions.filter(entry => entry.image_id === id);
  const voted = mine.find(entry => entry.interaction_type === 'voted');

  return {
    faved: mine.some(entry => entry.interaction_type === 'faved'),
    voted: voted?.value === 'up' || voted?.value === 'down' ? voted.value : null,
    hidden: mine.some(entry => entry.interaction_type === 'hidden'),
  };
}

export type InteractionAction = 'upvote' | 'downvote' | 'unvote' | 'fave' | 'unfave' | 'hide' | 'unhide';

/** Does what a button on the image page does. Answers the counters it leaves. */
export function interact(id: number, action: InteractionAction): Promise<ImageCounters> {
  switch (action) {
    case 'upvote':
      return post<ImageCounters>(`/images/${id}/vote`, { up: true });
    case 'downvote':
      return post<ImageCounters>(`/images/${id}/vote`, { up: false });
    case 'unvote':
      return remove<ImageCounters>(`/images/${id}/vote`);
    case 'fave':
      return post<ImageCounters>(`/images/${id}/fave`, {});
    case 'unfave':
      return remove<ImageCounters>(`/images/${id}/fave`);
    case 'hide':
      return post<ImageCounters>(`/images/${id}/hide`, {});
    case 'unhide':
      return remove<ImageCounters>(`/images/${id}/hide`);
  }
}

/** A tag with what the site says about it. */
export interface TagInfo {
  name: string;
  slug: string;
  category: null | string;
  shortDescription: null | string;
  description: string;
  imageCount: number;
  aliases: Array<string>;
  aliasedTag: null | string;
  impliedTags: Array<string>;
  impliedByTags: Array<string>;
}

export function fetchTag(slug: string): Promise<TagInfo> {
  return get<TagInfo>(`/tags/${encodeURIComponent(slug)}`);
}

/** A filter: what it hides and what it spoilers. Tags come as ids only. */
export interface FilterInfo {
  id: number;
  name: string;
  description: string;
  public: boolean;
  system: boolean;
  userCount: number;
  hiddenTagIds: Array<number>;
  spoileredTagIds: Array<number>;
  hiddenComplex: null | string;
  spoileredComplex: null | string;
}

export async function fetchSystemFilters(): Promise<Array<FilterInfo>> {
  const { items } = await get<{ items: Array<FilterInfo> }>('/filters/system');

  return items;
}

export function fetchFilter(id: number): Promise<FilterInfo> {
  return get<FilterInfo>(`/filters/${id}`);
}

export interface ChannelEntry {
  id: number;
  title: string;
  live: boolean;
  viewers: null | number;
  nsfw: boolean;
  thumbnailUrl: string;
  artistTag: null | string;
}

export async function fetchChannels(): Promise<Array<ChannelEntry>> {
  const { items } = await get<{ items: Array<ChannelEntry> }>('/channels');

  return items;
}

interface Listing<T> {
  items: Array<T>;
  total: number;
  page: number;
  perPage: number;
}

export interface GalleryEntry {
  id: number;
  title: string;
  description: string;
  user: string;
  userId: number;
}

export function fetchGalleries(page: number, perPage: number): Promise<Listing<GalleryEntry>> {
  return get<Listing<GalleryEntry>>('/galleries', { q: '*', page, perPage });
}

export interface CommentEntry {
  id: number;
  imageId: number;
  createdAt: string;
  body: string;
  author: string;
  avatarUrl: string;
  imageThumbTiny: null | string;
}

export function fetchComments(query: string, page: number, perPage: number): Promise<Listing<CommentEntry>> {
  return get<Listing<CommentEntry>>('/comments', { q: query, page, perPage });
}

export type Neighbour = 'prev' | 'next' | 'random';

/**
 * The id of the image beside this one in a search, or `null` when there is none.
 * "Previous" is the next newer image and "next" the next older, as on the sites.
 * Random ignores which image this is.
 */
export async function fetchNeighbour(id: number, query: string, rel: Neighbour): Promise<null | number> {
  const within = (condition: string) => (query === '*' ? condition : `(${query}), ${condition}`);
  const params = {
    prev: { q: within(`id.gt:${id}`), sf: 'id', sd: 'asc' },
    next: { q: within(`id.lt:${id}`), sf: 'id', sd: 'desc' },
    random: { q: query, sf: 'random', sd: 'desc' },
  }[rel];
  const { items } = await get<{ items: Array<{ id: number }> }>('/search', { ...params, page: 1, perPage: 1 });

  return items[0]?.id ?? null;
}
