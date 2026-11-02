export type RouteClass = 'api-json' | 'rss' | 'html-page' | 'html-form' | 'mutation' | 'asset' | 'infra';
export type Area = 'public' | 'auth' | 'user' | 'moderator' | 'admin';
type Status = 'todo' | 'mapped' | 'verified' | 'skipped';

export interface CoverageEntry {
  controller: string;
  instances: string[];
  class: RouteClass;
  area: Area;
  phase: number;
  status: Status;
  operations: string[];
  note: string;
}
