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
