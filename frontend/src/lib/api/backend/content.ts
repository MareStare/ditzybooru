/** The site's own pages (rules, staff, static pages), read through our API. */

import { get } from '#/lib/api/backend/client';

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

export interface TopicPost {
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
  posts: Array<TopicPost>;
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
